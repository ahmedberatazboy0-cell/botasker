import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { harness } from "./free-harness";
import { encode, Timestamp } from "../supabase/functions/birarada/records";
import { inspectJpeg, inspectMp4 } from "../supabase/functions/birarada/media";
test("free PostgreSQL + Edge gateway enforces identity, privacy, roles, media and atomic writes", async (t) => {
  const h = await harness();
  const now = () => Timestamp.now();
  const profile = (uid: string, privateProfile = false) => ({
    uid,
    username: uid + "_user",
    displayName: uid,
    bio: "",
    website: "",
    avatarUrl: "",
    isPrivate: privateProfile,
    allowStrangerDM: true,
    createdAt: now(),
    deletionPending: false,
    termsVersion: "2026-10-21-free1",
    termsAcceptedAt: now(),
  });
  try {
    for (const name of ["alice", "bob", "eve"]) {
      await h.db.doc("users/" + name).set(profile(name, name === "alice"));
    }
    await t.test("anonymous clients cannot invoke APIs or read locked tables/RPCs", async () => {
      assert.equal(
        (await h.request(null, "socialApi", {
          action: "listContent",
          input: {},
        })).status,
        401,
      );
      await h.pg.exec("set role anon");
      await assert.rejects(
        h.pg.query("select * from public.birarada_records"),
        /permission denied/,
      );
      await assert.rejects(
        h.pg.query("select public.birarada_query('{}')"),
        /permission denied/,
      );
      await h.pg.exec("reset role");
    });
    await t.test("verified owner activation pins UID and stores roles server-side", async () => {
      assert.equal(
        (await h.call("eve", "activateOwner", { acceptTerms: true })).status,
        403,
      );
      const r = await h.call("owner", "activateOwner", { acceptTerms: true });
      assert.equal(r.status, 200, JSON.stringify(r));
      assert.equal((await h.db.doc("roles/owner").get()).get("role"), "owner");
      assert.equal((await h.db.doc("system/owner").get()).get("uid"), "owner");
    });
    await t.test("profile/role/media forgery is rejected through the generic document endpoint", async () => {
      const old = await h.db.doc("users/eve").get();
      for (
        const target of [{
          kind: "set",
          path: "roles/eve",
          data: { role: "owner" },
        }, {
          kind: "set",
          path: "users/eve",
          data: { ...encode(old.data()), official: true },
        }, {
          kind: "set",
          path: "media/" + randomUUID(),
          data: { uid: "eve", status: "ready" },
        }]
      ) {
        const r = await h.request("eve", "documents", {
          operation: "commit",
          reads: [],
          writes: [target],
        });
        assert.equal(r.status, 403, await r.text());
      }
    });
    let mediaId: string, postId: string;
    await t.test("real JPEG upload remains private, with authenticated access and range support", async () => {
      const bytes = new Uint8Array(
        await readFile(new URL("./free-photo.jpg", import.meta.url)),
      );
      mediaId = randomUUID();
      const reserved = await h.call("alice", "createUpload", {
        requestId: mediaId,
        kind: "image",
        purpose: "post",
        bytes: bytes.length,
      });
      assert.equal(reserved.status, 200, JSON.stringify(reserved));
      assert.equal(
        (await h.request("eve", "mediaUpload?id=" + mediaId, bytes, "PUT"))
          .status,
        403,
      );
      assert.equal(
        (await h.request("alice", "mediaUpload?id=" + mediaId, bytes, "PUT"))
          .status,
        200,
      );
      postId = randomUUID();
      assert.equal(
        (await h.call("alice", "publishContent", {
          requestId: postId,
          kind: "post",
          caption: "#gece",
          mediaIds: [mediaId],
        })).status,
        200,
      );
      assert.equal(
        (await h.request("bob", "mediaContent?id=" + mediaId, undefined, "GET"))
          .status,
        403,
      );
      await h.db.doc("follows/bob_alice").set({
        followerUid: "bob",
        followingUid: "alice",
        status: "accepted",
      });
      const response = await h.request(
        "bob",
        "mediaContent?id=" + mediaId,
        undefined,
        "GET",
        { Range: "bytes=0-7" },
      );
      assert.equal(response.status, 206);
      assert.equal((await response.arrayBuffer()).byteLength, 8);
      assert.equal(response.headers.get("cache-control"), "private, no-store");
      await h.db.doc("users/alice/blocks/bob").set({ uid: "bob" });
      assert.equal(
        (await h.request("bob", "mediaContent?id=" + mediaId, undefined, "GET"))
          .status,
        403,
      );
      await h.db.doc("users/alice/blocks/bob").delete();
    });
    await t.test("raw JPEG/MP4/AAC fixtures are validated and malformed formats rejected", async () => {
      const jpeg = new Uint8Array(
        await readFile(new URL("./free-photo.jpg", import.meta.url)),
      );
      assert.equal(inspectJpeg(jpeg).width, 160);
      const movie = new Uint8Array(
          await readFile(new URL("./free-video.mp4", import.meta.url)),
        ),
        voice = new Uint8Array(
          await readFile(new URL("./free-voice.m4a", import.meta.url)),
        );
      assert.equal(inspectMp4(movie, "video", "reel").width, 160);
      assert.ok(inspectMp4(voice, "audio", "message").duration > 0);
      assert.throws(() => inspectJpeg(new TextEncoder().encode("<svg/>")));
      assert.throws(() => inspectMp4(movie.slice(0, 30), "video", "reel"));
    });
    await t.test("post idempotency rejects changed text and story expiry/highlights are server checked", async () => {
      assert.equal(
        (await h.call("alice", "publishContent", {
          requestId: postId,
          kind: "post",
          caption: "changed",
          mediaIds: [mediaId],
        })).status,
        412,
      );
      const storyId = randomUUID();
      await h.db.doc("stories/" + storyId).set({
        uid: "alice",
        username: "alice",
        audience: "private",
        kind: "story",
        createdAt: now(),
        expiresAt: Timestamp.fromMillis(Date.now() - 1000),
        highlighted: false,
        mediaIds: [],
      });
      assert.equal(
        (await h.call("bob", "getContent", { kind: "story", id: storyId }))
          .status,
        403,
      );
      assert.equal(
        (await h.call("alice", "highlightStory", {
          id: storyId,
          enabled: true,
          title: "Anlar",
        })).status,
        200,
      );
      assert.equal(
        (await h.call("bob", "getContent", { kind: "story", id: storyId }))
          .status,
        200,
      );
    });
    await t.test("message membership, recipient consent, reply/reactions and group departure are enforced", async () => {
      await h.db.doc("users/eve").update({ allowStrangerDM: false });
      assert.equal(
        (await h.call("alice", "createChat", { members: ["eve"] })).status,
        403,
      );
      const c = await h.call("alice", "createChat", { members: ["bob"] });
      assert.equal(c.status, 200);
      const msg = randomUUID();
      assert.equal(
        (await h.call("alice", "sendMessage", {
          chatId: c.data.id,
          requestId: msg,
          text: "Merhaba",
        })).status,
        200,
      );
      assert.equal(
        (await h.call("eve", "reactMessage", {
          chatId: c.data.id,
          id: msg,
          reaction: "❤️",
        })).status,
        403,
      );
      assert.equal(
        (await h.call("bob", "reactMessage", {
          chatId: c.data.id,
          id: msg,
          reaction: "❤️",
        })).status,
        200,
      );
      await h.db.doc("users/eve").update({ allowStrangerDM: true });
      const group = await h.call("alice", "createChat", {
        group: true,
        requestId: randomUUID(),
        title: "Arkadaşlar",
        members: ["bob", "eve"],
      });
      assert.equal(group.status, 200);
      await h.call("bob", "leaveGroup", { chatId: group.data.id });
      assert.equal(
        (await h.call("bob", "sendMessage", {
          chatId: group.data.id,
          requestId: randomUUID(),
          text: "Yasak",
        })).status,
        403,
      );
    });
    await t.test("stale client revisions cannot overwrite concurrent profile edits", async () => {
      const old = await h.db.doc("users/eve").get();
      await h.db.doc("users/eve").update({ bio: "new" });
      const response = await h.request("eve", "documents", {
        operation: "commit",
        reads: [{ path: "users/eve", rev: old.raw.rev }],
        writes: [{
          kind: "set",
          path: "users/eve",
          data: encode({ ...old.data(), bio: "old" }),
        }],
      });
      assert.equal(response.status, 409);
      assert.equal((await h.db.doc("users/eve").get()).get("bio"), "new");
    });
    await t.test("suspension immediately blocks existing tokens and fake admin actions remain denied", async () => {
      assert.equal(
        (await h.call("eve", "setUserStatus", {
          uid: "bob",
          suspended: true,
          reason: "forged",
        })).status,
        400,
      );
      const r = await h.call("owner", "setUserStatus", {
        uid: "eve",
        suspended: true,
        reason: "Test",
      });
      assert.equal(r.status, 200, JSON.stringify(r));
      // Pin token times to the actual revocation boundary, rather than depending
      // on whether this test happens to cross a wall-clock second on this machine.
      const identity = h.users.get("eve")!;
      const revokedAt = (await h.db.doc("roles/eve").get()).get("reauthAfter");
      assert.equal(typeof revokedAt, "number");
      h.users.set("eve", {
        ...identity,
        authTime: revokedAt - 1,
        issuedAt: revokedAt - 1,
      });
      const revoked = await h.call("eve", "listContent");
      assert.equal(revoked.status, 401);
      assert.equal(revoked.error.code, "unauthenticated");

      h.users.set("eve", {
        ...identity,
        authTime: revokedAt,
        issuedAt: revokedAt,
      });
      const suspended = await h.call("eve", "listContent");
      assert.equal(suspended.status, 403);
      assert.equal(suspended.error.code, "permission-denied");
      const documents = await h.request("eve", "documents", {
        operation: "get",
        paths: ["users/eve"],
      });
      assert.equal(documents.status, 403);
    });
    await t.test("generic client profile creation, song notes and 500-row UI queries use the same secured backend", async () => {
      h.users.set("charlie", {
        uid: "charlie",
        email: "charlie@example.test",
        emailVerified: true,
        authTime: Math.floor(Date.now() / 1000),
        issuedAt: Math.floor(Date.now() / 1000),
      });
      const fields = {
        ...profile("charlie", true),
        allowStrangerDM: false,
        followersCount: 0,
        followingCount: 0,
        postsCount: 0,
      };
      const create = await h.request("charlie", "documents", {
        operation: "commit",
        reads: [],
        writes: [{
          kind: "set",
          path: "usernames/charlie_user",
          data: { uid: "charlie" },
        }, { kind: "set", path: "users/charlie", data: encode(fields) }],
      });
      assert.equal(create.status, 200, await create.text());
      const note = {
        uid: "charlie",
        username: "charlie_user",
        text: "Bugünün şarkısı",
        songTitle: "Sanatçı — Şarkı",
        songUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        updatedAt: now(),
      };
      assert.equal(
        (await h.request("charlie", "documents", {
          operation: "commit",
          reads: [],
          writes: [{ kind: "set", path: "notes/charlie", data: encode(note) }],
        })).status,
        200,
      );
      assert.equal(
        (await h.request("charlie", "documents", {
          operation: "commit",
          reads: [],
          writes: [{
            kind: "set",
            path: "notes/charlie",
            data: encode({
              ...note,
              songUrl: "https://youtube.com.evil.test/watch?v=dQw4w9WgXcQ",
            }),
          }],
        })).status,
        403,
      );
      for (const title of ["A".repeat(120), ""]) {
        const r = await h.request("charlie", "documents", {
          operation: "commit",
          reads: [],
          writes: [{
            kind: "set",
            path: "notes/charlie",
            data: encode({ ...note, songTitle: title }),
          }],
        });
        assert.equal(r.status, title ? 200 : 403);
      }
      assert.equal(
        (await h.request("alice", "documents", {
          operation: "query",
          spec: {
            path: "posts/" + postId + "/likes",
            filters: [],
            orders: [],
            limit: 500,
          },
        })).status,
        200,
      );
    });
    await t.test("lazy expiration removes old uploads and stories but preserves highlights and attached media", async () => {
      const orphan = randomUUID(),
        story = randomUUID(),
        highlight = randomUUID(),
        path = "private/bob/" + orphan;
      h.objects.set(path, { bytes: new Uint8Array([1]), type: "image/jpeg" });
      await h.db.doc("media/" + orphan).set({
        uid: "bob",
        path,
        expiresAt: Timestamp.fromMillis(Date.now() - 3600000),
        status: "ready",
      });
      for (
        const [id, highlighted] of [[story, false], [highlight, true]] as const
      ) {
        await h.db.doc("stories/" + id).set({
          uid: "bob",
          highlighted,
          expiresAt: Timestamp.fromMillis(Date.now() - 31 * 86400000),
          mediaIds: [],
        });
      }
      await h.db.doc("system/maintenance").delete();
      assert.equal((await h.call("bob", "capabilities")).status, 200);
      assert.equal((await h.db.doc("media/" + orphan).get()).exists, false);
      assert.equal(h.objects.has(path), false);
      assert.equal((await h.db.doc("stories/" + story).get()).exists, false);
      assert.equal((await h.db.doc("stories/" + highlight).get()).exists, true);
      assert.equal((await h.db.doc("media/" + mediaId).get()).exists, true);
    });
    await t.test("pending deletion can remove authored activity after leaving a group or losing post visibility", async () => {
      const comment = "posts/" + postId + "/comments/bob-old",
        message = "chats/left-group/messages/bob-old";
      await h.db.doc(comment).set({ uid: "bob", text: "old" });
      await h.db.doc("chats/left-group").set({ memberIds: ["alice"] });
      await h.db.doc(message).set({ senderUid: "bob", text: "old" });
      await h.db.doc("users/bob").update({ deletionPending: true });
      for (
        const [path, kind, field] of [[comment, "comments", "uid"], [
          message,
          "messages",
          "senderUid",
        ]]
      ) {
        const query = await h.request("bob", "documents", {
          operation: "query",
          spec: {
            path: kind,
            group: true,
            filters: [[field, "==", "bob"]],
            orders: [],
            limit: 100,
          },
        });
        assert.equal(query.status, 200);
        assert.ok(
          (await query.json()).data.some((row: any) => row.path === path),
        );
        const remove = await h.request("bob", "documents", {
          operation: "commit",
          reads: [],
          writes: [{ kind: "delete", path }],
        });
        assert.equal(remove.status, 200, await remove.text());
        assert.equal((await h.db.doc(path).get()).exists, false);
      }
    });
    await t.test("account cleanup removes private objects/posts before Authentication removal", async () => {
      await h.db.doc("users/alice").update({ deletionPending: true });
      const r = await h.call("alice", "cleanupSocialData");
      assert.equal(r.status, 200, JSON.stringify(r));
      assert.equal((await h.db.doc("media/" + mediaId).get()).exists, false);
      assert.equal((await h.db.doc("posts/" + postId).get()).exists, false);
      assert.equal(h.objects.size, 0);
    });
  } finally {
    await h.pg.close();
  }
});
