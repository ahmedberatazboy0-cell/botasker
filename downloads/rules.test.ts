import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  collectionGroup,
  query,
  where,
  getDocs,
  writeBatch,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

let env: RulesTestEnvironment;
before(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-birarada",
    firestore: {
      rules: readFileSync("firestore.rules", "utf8"),
      host: "127.0.0.1",
      port: 8080,
    },
  });
});
after(async () => {
  await env?.cleanup();
});

const db = (uid: string) => env.authenticatedContext(uid).firestore();
const guest = () => env.unauthenticatedContext().firestore();
const profile = (uid: string, isPrivate = true) => ({
  uid,
  username: uid,
  displayName: uid,
  bio: "",
  website: "",
  avatarUrl: "",
  isPrivate,
  allowStrangerDM: false,
  followersCount: 0,
  followingCount: 0,
  postsCount: 0,
  createdAt: serverTimestamp(),
  deletionPending: false,
  termsAcceptedAt: serverTimestamp(),
  termsVersion: "2026-10-19",
});
const post = (uid = "alice", audience = "public") => ({
  uid,
  username: uid,
  caption: "Merhaba",
  mediaUrl: "",
  mediaType: "image",
  commentsEnabled: true,
  audience,
  createdAt: serverTimestamp(),
});
const followData = (
  followerUid = "alice",
  followingUid = "bob",
  status = "pending",
) => ({
  followerUid,
  followingUid,
  status,
  createdAt: serverTimestamp(),
});
const notification = (sourceUid = "alice", targetUid = "bob") => ({
  sourceUid,
  targetUid,
  type: "follow",
  text: `@${sourceUid} seninle bağlantı kurmak istiyor.`,
  read: false,
  createdAt: serverTimestamp(),
});
const message = (senderUid = "alice", text = "Merhaba") => ({
  senderUid,
  text,
  type: "text",
  seenBy: [senderUid],
  createdAt: serverTimestamp(),
});
const seed = (path: string, value: Record<string, unknown>) =>
  env.withSecurityRulesDisabled((ctx) =>
    setDoc(doc(ctx.firestore(), path), value),
  );
const createProfile = (
  uid: string,
  overrides: Record<string, unknown> = {},
) => {
  const database = db(uid),
    batch = writeBatch(database);
  batch.set(doc(database, "usernames", uid), { uid });
  batch.set(doc(database, "users", uid), { ...profile(uid), ...overrides });
  return batch.commit();
};

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const database = ctx.firestore(),
      batch = writeBatch(database);
    for (const uid of ["alice", "bob", "eve", "mallory"]) {
      batch.set(doc(database, "users", uid), profile(uid, uid === "bob"));
      batch.set(doc(database, "usernames", uid), { uid });
    }
    batch.set(doc(database, "posts", "private"), post("bob", "private"));
    batch.set(doc(database, "posts", "public"), post());
    batch.set(doc(database, "chats", "alice:bob"), {
      memberIds: ["alice", "bob"],
      lastMessage: "",
      lastMessageAt: serverTimestamp(),
    });
    await batch.commit();
  });
});

test("signed-out clients cannot read profiles, posts, names, or messages", async () => {
  for (const path of [
    "users/alice",
    "usernames/alice",
    "posts/public",
    "chats/alice:bob",
  ])
    await assertFails(getDoc(doc(guest(), path)));
  await assertFails(setDoc(doc(guest(), "posts", "attack"), post()));
});

const note = (uid = "bob") => ({
  uid,
  username: uid,
  text: "Bugünün şarkısı",
  songTitle: "Sanatçı – Şarkı",
  songUrl: "https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC",
  updatedAt: serverTimestamp(),
});

test("notes are private to the author and accepted followers, never listed publicly", async () => {
  await assertSucceeds(setDoc(doc(db("bob"), "notes", "bob"), note()));
  await assertSucceeds(getDoc(doc(db("bob"), "notes", "bob")));
  await assertFails(getDoc(doc(guest(), "notes", "bob")));
  await assertFails(getDoc(doc(db("alice"), "notes", "bob")));
  await seed("follows/alice_bob", followData("alice", "bob", "pending"));
  await assertFails(getDoc(doc(db("alice"), "notes", "bob")));
  await seed("follows/alice_bob", followData("alice", "bob", "accepted"));
  await assertSucceeds(getDoc(doc(db("alice"), "notes", "bob")));
  await assertFails(getDocs(collection(db("bob"), "notes")));
  await assertFails(
    getDocs(query(collection(db("alice"), "notes"), where("uid", "==", "bob"))),
  );
});

test("both directions of blocking and removed follows revoke note access", async () => {
  await seed("notes/bob", note());
  await seed("follows/alice_bob", followData("alice", "bob", "accepted"));
  for (const path of ["users/alice/blocks/bob", "users/bob/blocks/alice"]) {
    await seed(path, { uid: "blocked", createdAt: serverTimestamp() });
    await assertFails(getDoc(doc(db("alice"), "notes", "bob")));
    await env.withSecurityRulesDisabled((ctx) =>
      deleteDoc(doc(ctx.firestore(), path)),
    );
  }
  await assertSucceeds(deleteDoc(doc(db("alice"), "follows", "alice_bob")));
  await assertFails(getDoc(doc(db("alice"), "notes", "bob")));
});

test("expired notes cannot be read by followers, while author can replace or delete them", async () => {
  await seed("follows/alice_bob", followData("alice", "bob", "accepted"));
  await seed("notes/bob", {
    ...note(),
    updatedAt: Timestamp.fromMillis(Date.now() - 25 * 60 * 60 * 1000),
  });
  await assertFails(getDoc(doc(db("alice"), "notes", "bob")));
  await assertSucceeds(getDoc(doc(db("bob"), "notes", "bob")));
  await assertSucceeds(setDoc(doc(db("bob"), "notes", "bob"), note()));
  await assertSucceeds(getDoc(doc(db("alice"), "notes", "bob")));
  await assertSucceeds(deleteDoc(doc(db("bob"), "notes", "bob")));
  assert.equal(
    (await assertSucceeds(getDoc(doc(db("alice"), "notes", "bob")))).exists(),
    false,
  );
});

test("note writes enforce identity, timestamp, shape, content limits and safe song URLs", async () => {
  const target = doc(db("bob"), "notes", "bob");
  await assertSucceeds(
    setDoc(target, {
      ...note(),
      text: "",
      songUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    }),
  );
  await assertSucceeds(
    setDoc(target, { ...note(), songTitle: "", songUrl: "" }),
  );
  for (const fields of [
    { uid: "alice" },
    { username: "alice" },
    { text: "x".repeat(61) },
    { songTitle: "x".repeat(121) },
    { text: "", songTitle: "", songUrl: "" },
    { songTitle: "" },
    { songUrl: "" },
    {
      songUrl:
        "https://open.spotify.com.evil.test/track/4uLU6hMCjMI75M1A2tKUQC",
    },
    { songUrl: "javascript:alert(1)" },
    { songUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=extra" },
    { songUrl: "https://open.spotify.com/album/4uLU6hMCjMI75M1A2tKUQC" },
    { text: 12 },
    { updatedAt: Timestamp.fromMillis(Date.now() + 1000000) },
    { likesCount: 999 },
  ])
    await assertFails(setDoc(target, { ...note(), ...fields }));
  await assertFails(setDoc(doc(db("alice"), "notes", "bob"), note("alice")));
  await assertFails(deleteDoc(doc(db("alice"), "notes", "bob")));
});

test("account deletion disables note publication and follower reads but permits cleanup retries", async () => {
  await seed("notes/bob", note());
  await seed("follows/alice_bob", followData("alice", "bob", "accepted"));
  await assertSucceeds(
    updateDoc(doc(db("bob"), "users", "bob"), { deletionPending: true }),
  );
  await assertFails(setDoc(doc(db("bob"), "notes", "bob"), note()));
  await assertFails(getDoc(doc(db("alice"), "notes", "bob")));
  await env.withSecurityRulesDisabled((ctx) =>
    deleteDoc(doc(ctx.firestore(), "users", "bob")),
  );
  await assertSucceeds(deleteDoc(doc(db("bob"), "notes", "bob")));
  await assertSucceeds(deleteDoc(doc(db("bob"), "notes", "bob")));
});

test("note reports preserve an authentic snapshot and reject forged or inaccessible content", async () => {
  await seed("notes/bob", note());
  await seed("follows/alice_bob", followData("alice", "bob", "accepted"));
  const data = (await getDoc(doc(db("alice"), "notes", "bob"))).data()!;
  const snapshot = {
    text: data.text,
    songTitle: data.songTitle,
    songUrl: data.songUrl,
    updatedAt: data.updatedAt,
  };
  const payload = {
    reporterUid: "alice",
    targetUid: "bob",
    reason: "Uygunsuz not",
    createdAt: serverTimestamp(),
    noteSnapshot: snapshot,
  };
  await assertSucceeds(
    setDoc(doc(db("alice"), "reports", "note-report"), payload),
  );
  await assertFails(
    setDoc(doc(db("alice"), "reports", "forged-note"), {
      ...payload,
      noteSnapshot: { ...snapshot, text: "Uydurma" },
    }),
  );
  await assertFails(
    setDoc(doc(db("alice"), "reports", "forged-time"), {
      ...payload,
      noteSnapshot: { ...snapshot, updatedAt: Timestamp.fromMillis(0) },
    }),
  );
  await assertFails(
    setDoc(doc(db("alice"), "reports", "mixed-targets"), {
      ...payload,
      postId: "private",
    }),
  );
  await assertFails(
    setDoc(doc(db("eve"), "reports", "stranger-note"), {
      ...payload,
      reporterUid: "eve",
    }),
  );
  await assertSucceeds(deleteDoc(doc(db("bob"), "notes", "bob")));
  await assertFails(
    setDoc(doc(db("alice"), "reports", "removed-note"), payload),
  );
});

test("profile and username are created atomically with current consent", async () => {
  await assertSucceeds(createProfile("newuser"));
  await assertFails(
    setDoc(doc(db("eve"), "usernames", "newuser"), { uid: "eve" }),
  );
  await assertFails(
    setDoc(doc(db("orphan"), "users", "orphan"), profile("orphan")),
  );
  await assertFails(
    setDoc(doc(db("orphan"), "usernames", "orphan"), { uid: "orphan" }),
  );
});

test("profile creation rejects absent/stale consent and unsafe fields", async () => {
  const database = db("missingconsent"),
    missing = writeBatch(database);
  const {
    termsAcceptedAt: _accepted,
    termsVersion: _version,
    ...withoutConsent
  } = profile("missingconsent");
  missing.set(doc(database, "usernames", "missingconsent"), {
    uid: "missingconsent",
  });
  missing.set(doc(database, "users", "missingconsent"), withoutConsent);
  await assertFails(missing.commit());
  await assertFails(createProfile("noconsent", { termsVersion: "old" }));
  await assertFails(
    createProfile("forgedtime", { termsAcceptedAt: Timestamp.fromMillis(0) }),
  );
  await assertFails(createProfile("noconsenttime", { termsAcceptedAt: null }));
  await assertFails(
    createProfile("unsafeavatar", {
      avatarUrl: "https://tracker.example/avatar",
    }),
  );
  await assertFails(createProfile("forgedcounter", { followersCount: 100 }));
  await assertFails(
    createProfile("extraprivate", { email: "never-in-profile@example.test" }),
  );
});

test("profile edits validate types, limits, ownership and immutable counters", async () => {
  const own = doc(db("alice"), "users", "alice");
  await assertSucceeds(updateDoc(own, { bio: "Merhaba", isPrivate: true }));
  await assertFails(
    updateDoc(doc(db("bob"), "users", "alice"), { bio: "Hijacked" }),
  );
  for (const fields of [
    { followersCount: 100 },
    { followingCount: 100 },
    { postsCount: 100 },
    { username: "taken" },
    { displayName: "a" },
    { bio: "x".repeat(161) },
    { website: "x".repeat(201) },
    { isPrivate: "true" },
    { allowStrangerDM: 1 },
    { avatarUrl: "https://tracker.example/avatar" },
    { termsVersion: "forged" },
  ])
    await assertFails(updateDoc(own, fields));
});

test("private posts need accepted follow; either direction of block removes access", async () => {
  await assertFails(getDoc(doc(db("alice"), "posts", "private")));
  await seed("follows/alice_bob", followData("alice", "bob", "pending"));
  await assertFails(getDoc(doc(db("alice"), "posts", "private")));
  await seed("follows/alice_bob", followData("alice", "bob", "accepted"));
  await assertSucceeds(getDoc(doc(db("alice"), "posts", "private")));
  await assertSucceeds(
    setDoc(doc(db("bob"), "users", "bob", "blocks", "alice"), {
      uid: "alice",
      createdAt: serverTimestamp(),
    }),
  );
  await assertFails(getDoc(doc(db("alice"), "posts", "private")));
  await assertSucceeds(
    deleteDoc(doc(db("bob"), "users", "bob", "blocks", "alice")),
  );
  await seed("users/alice/blocks/bob", {
    uid: "bob",
    createdAt: serverTimestamp(),
  });
  await assertFails(getDoc(doc(db("alice"), "posts", "private")));
  await assertSucceeds(getDoc(doc(db("bob"), "posts", "private")));
});

test("public feed and scoped profile queries work; broad unfiltered query fails", async () => {
  await assertSucceeds(
    getDocs(
      query(collection(db("eve"), "posts"), where("audience", "==", "public")),
    ),
  );
  await assertSucceeds(
    getDocs(query(collection(db("bob"), "posts"), where("uid", "==", "bob"))),
  );
  await assertFails(getDocs(collection(db("eve"), "posts")));
  await assertFails(
    getDocs(query(collection(db("eve"), "posts"), where("uid", "==", "bob"))),
  );
  await seed("follows/eve_bob", followData("eve", "bob", "accepted"));
  await assertSucceeds(
    getDocs(query(collection(db("eve"), "posts"), where("uid", "==", "bob"))),
  );
});

test("blocking does not promise secrecy for already public posts; interactions are denied", async () => {
  await seed("users/alice/blocks/eve", {
    uid: "eve",
    createdAt: serverTimestamp(),
  });
  await assertSucceeds(getDoc(doc(db("eve"), "posts", "public")));
  await assertSucceeds(
    getDocs(
      query(collection(db("eve"), "posts"), where("audience", "==", "public")),
    ),
  );
  await assertFails(
    setDoc(doc(db("eve"), "posts", "public", "likes", "eve"), {
      uid: "eve",
      createdAt: serverTimestamp(),
    }),
  );
  await assertFails(
    setDoc(doc(db("eve"), "posts", "public", "comments", "blocked"), {
      uid: "eve",
      username: "eve",
      text: "x",
      createdAt: serverTimestamp(),
    }),
  );
});

test("text post creation validates author, audience, time, shape, and disabled media", async () => {
  await assertSucceeds(setDoc(doc(db("alice"), "posts", "created"), post()));
  await assertSucceeds(
    setDoc(doc(db("bob"), "posts", "ownprivate"), post("bob", "private")),
  );
  const target = doc(db("alice"), "posts", "attack");
  for (const fields of [
    { uid: "bob" },
    { username: "bob" },
    { audience: "private" },
    { caption: "" },
    { caption: "x".repeat(2201) },
    { mediaUrl: "https://tracker.example/image.jpg" },
    { mediaType: "audio" },
    { commentsEnabled: "true" },
    { createdAt: Timestamp.fromMillis(0) },
    { likesCount: 999 },
  ])
    await assertFails(setDoc(target, { ...post(), ...fields }));
});

test("only owner deletes post and clients cannot mutate post content or audience", async () => {
  await assertFails(
    updateDoc(doc(db("alice"), "posts", "public"), { caption: "changed" }),
  );
  await assertFails(
    updateDoc(doc(db("alice"), "posts", "public"), { audience: "private" }),
  );
  await assertFails(deleteDoc(doc(db("bob"), "posts", "public")));
  await assertSucceeds(deleteDoc(doc(db("alice"), "posts", "public")));
});

test("likes use authenticated identity, protect private posts, and deny extra counters", async () => {
  const own = doc(db("eve"), "posts", "public", "likes", "eve");
  await assertSucceeds(getDoc(own));
  await assertSucceeds(
    setDoc(own, { uid: "eve", createdAt: serverTimestamp() }),
  );
  await assertFails(
    setDoc(doc(db("eve"), "posts", "public", "likes", "bob"), {
      uid: "bob",
      createdAt: serverTimestamp(),
    }),
  );
  await assertFails(
    setDoc(doc(db("bob"), "posts", "public", "likes", "bob"), {
      uid: "bob",
      count: 99,
      createdAt: serverTimestamp(),
    }),
  );
  await assertFails(
    setDoc(doc(db("eve"), "posts", "private", "likes", "eve"), {
      uid: "eve",
      createdAt: serverTimestamp(),
    }),
  );
  await assertFails(
    deleteDoc(doc(db("bob"), "posts", "public", "likes", "eve")),
  );
  await assertSucceeds(
    deleteDoc(doc(db("eve"), "posts", "public", "likes", "eve")),
  );
});

test("comments validate identity, bounds, parent existence and commentsEnabled", async () => {
  const target = doc(db("eve"), "posts", "public", "comments", "one");
  const valid = {
    uid: "eve",
    username: "eve",
    text: "Merhaba",
    createdAt: serverTimestamp(),
  };
  await assertSucceeds(setDoc(target, valid));
  for (const fields of [
    { uid: "bob" },
    { username: "bob" },
    { text: "" },
    { text: "x".repeat(1001) },
    { admin: true },
  ])
    await assertFails(
      setDoc(doc(db("eve"), "posts", "public", "comments", "bad"), {
        ...valid,
        ...fields,
      }),
    );
  await seed("posts/closed", { ...post(), commentsEnabled: false });
  await assertFails(
    setDoc(doc(db("eve"), "posts", "closed", "comments", "bad"), valid),
  );
  await assertFails(
    setDoc(doc(db("eve"), "posts", "missing", "comments", "bad"), valid),
  );
  await assertFails(
    deleteDoc(doc(db("bob"), "posts", "public", "comments", "one")),
  );
  await assertSucceeds(
    deleteDoc(doc(db("alice"), "posts", "public", "comments", "one")),
  );
});

test("private follow is pending and only target can accept its immutable relation", async () => {
  const target = doc(db("alice"), "follows", "alice_bob");
  await assertSucceeds(getDoc(target));
  await assertFails(setDoc(target, followData("alice", "bob", "accepted")));
  await assertSucceeds(setDoc(target, followData()));
  await assertFails(updateDoc(target, { status: "accepted" }));
  await assertFails(
    updateDoc(doc(db("eve"), "follows", "alice_bob"), { status: "accepted" }),
  );
  await assertFails(
    updateDoc(doc(db("bob"), "follows", "alice_bob"), {
      status: "accepted",
      followerUid: "eve",
    }),
  );
  await assertSucceeds(
    updateDoc(doc(db("bob"), "follows", "alice_bob"), { status: "accepted" }),
  );
});

test("follow creation rejects self, unknown target, wrong ID, spoofed identity, and blocks", async () => {
  await assertSucceeds(
    setDoc(
      doc(db("bob"), "follows", "bob_alice"),
      followData("bob", "alice", "accepted"),
    ),
  );
  await assertFails(
    setDoc(
      doc(db("alice"), "follows", "alice_alice"),
      followData("alice", "alice", "accepted"),
    ),
  );
  await assertFails(setDoc(doc(db("alice"), "follows", "wrong"), followData()));
  await assertFails(
    setDoc(doc(db("alice"), "follows", "eve_bob"), followData("eve")),
  );
  await assertFails(
    setDoc(
      doc(db("alice"), "follows", "alice_missing"),
      followData("alice", "missing"),
    ),
  );
  await seed("users/bob/blocks/alice", { uid: "alice" });
  await assertFails(
    setDoc(doc(db("alice"), "follows", "alice_bob"), followData()),
  );
});

test("blocked pending follows cannot be accepted, and participant can remove relation", async () => {
  await seed("follows/alice_bob", followData());
  await seed("users/bob/blocks/alice", { uid: "alice" });
  await assertFails(
    updateDoc(doc(db("bob"), "follows", "alice_bob"), { status: "accepted" }),
  );
  await assertFails(deleteDoc(doc(db("eve"), "follows", "alice_bob")));
  await assertSucceeds(deleteDoc(doc(db("alice"), "follows", "alice_bob")));
});

test("follow participant queries work; third parties cannot list others' relations", async () => {
  await seed("follows/alice_bob", followData());
  await assertSucceeds(
    getDocs(
      query(
        collection(db("alice"), "follows"),
        where("followerUid", "==", "alice"),
      ),
    ),
  );
  await assertSucceeds(
    getDocs(
      query(
        collection(db("bob"), "follows"),
        where("followingUid", "==", "bob"),
      ),
    ),
  );
  await assertFails(getDoc(doc(db("eve"), "follows", "alice_bob")));
  await assertFails(
    getDocs(
      query(
        collection(db("eve"), "follows"),
        where("followingUid", "==", "bob"),
      ),
    ),
  );
});

test("saved posts are private, validate parent visibility and server timestamp", async () => {
  const own = doc(db("eve"), "saved", "eve", "posts", "public");
  await assertSucceeds(getDoc(own));
  await assertSucceeds(
    setDoc(own, { postId: "public", createdAt: serverTimestamp() }),
  );
  await assertFails(getDoc(doc(db("bob"), "saved", "eve", "posts", "public")));
  await assertFails(
    setDoc(doc(db("eve"), "saved", "bob", "posts", "public"), {
      postId: "public",
      createdAt: serverTimestamp(),
    }),
  );
  await assertFails(
    setDoc(doc(db("eve"), "saved", "eve", "posts", "private"), {
      postId: "private",
      createdAt: serverTimestamp(),
    }),
  );
  await assertFails(
    setDoc(doc(db("eve"), "saved", "eve", "posts", "missing"), {
      postId: "missing",
      createdAt: serverTimestamp(),
    }),
  );
  await assertSucceeds(deleteDoc(own));
});

test("blocks are visible only to owner and cannot spoof target or self", async () => {
  const own = doc(db("alice"), "users", "alice", "blocks", "eve");
  await assertSucceeds(
    setDoc(own, { uid: "eve", createdAt: serverTimestamp() }),
  );
  await assertFails(getDoc(doc(db("eve"), "users", "alice", "blocks", "eve")));
  await assertFails(
    setDoc(doc(db("eve"), "users", "alice", "blocks", "bob"), {
      uid: "bob",
      createdAt: serverTimestamp(),
    }),
  );
  await assertFails(
    setDoc(doc(db("alice"), "users", "alice", "blocks", "bob"), {
      uid: "eve",
      createdAt: serverTimestamp(),
    }),
  );
  await assertFails(
    setDoc(doc(db("alice"), "users", "alice", "blocks", "alice"), {
      uid: "alice",
      createdAt: serverTimestamp(),
    }),
  );
  await assertSucceeds(deleteDoc(own));
});

test("only members read chat history and outsiders cannot inject messages", async () => {
  await seed("chats/alice:bob/messages/one", message());
  await assertSucceeds(getDoc(doc(db("alice"), "chats", "alice:bob")));
  await assertFails(getDoc(doc(db("eve"), "chats", "alice:bob")));
  await assertFails(
    getDocs(collection(db("eve"), "chats", "alice:bob", "messages")),
  );
  await assertFails(
    setDoc(
      doc(db("eve"), "chats", "alice:bob", "messages", "attack"),
      message("eve"),
    ),
  );
  await assertSucceeds(
    getDocs(
      query(
        collection(db("alice"), "chats"),
        where("memberIds", "array-contains", "alice"),
      ),
    ),
  );
  await assertFails(getDocs(collection(db("eve"), "chats")));
});

test("new chat honors recipient preferences and requires a matching two-member ID", async () => {
  const database = db("alice"),
    chat = {
      memberIds: ["alice", "eve"],
      lastMessage: "",
      lastMessageAt: serverTimestamp(),
    };
  await assertSucceeds(getDoc(doc(database, "chats", "alice:eve")));
  await assertFails(setDoc(doc(database, "chats", "alice:eve"), chat));
  await seed("follows/eve_alice", followData("eve", "alice", "accepted"));
  await assertFails(setDoc(doc(database, "chats", "arbitrary"), chat));
  await assertFails(
    setDoc(doc(database, "chats", "alice:alice"), {
      ...chat,
      memberIds: ["alice", "alice"],
    }),
  );
  await assertFails(
    setDoc(doc(database, "chats", "alice:eve:mallory"), {
      ...chat,
      memberIds: ["alice", "eve", "mallory"],
    }),
  );
  await assertSucceeds(setDoc(doc(database, "chats", "alice:eve"), chat));
});

test("stranger DM opt-in permits initiation and both members can reply", async () => {
  await assertSucceeds(
    updateDoc(doc(db("eve"), "users", "eve"), { allowStrangerDM: true }),
  );
  await assertSucceeds(
    setDoc(doc(db("alice"), "chats", "alice:eve"), {
      memberIds: ["alice", "eve"],
      lastMessage: "",
      lastMessageAt: serverTimestamp(),
    }),
  );
  await assertSucceeds(
    setDoc(
      doc(db("alice"), "chats", "alice:eve", "messages", "one"),
      message(),
    ),
  );
  // Alice has not opted into stranger DMs and does not follow Eve. Eve must
  // nevertheless be able to reply in an already authorized conversation.
  await assertSucceeds(
    setDoc(
      doc(db("eve"), "chats", "alice:eve", "messages", "reply"),
      message("eve"),
    ),
  );
});

test("message create rejects forged sender, forged read receipt and invalid payload", async () => {
  const target = doc(db("alice"), "chats", "alice:bob", "messages", "bad");
  for (const fields of [
    { senderUid: "bob" },
    { seenBy: ["alice", "bob"] },
    { seenBy: ["bob"] },
    { text: "" },
    { text: "x".repeat(2001) },
    { type: "image" },
    { admin: true },
    { createdAt: Timestamp.fromMillis(0) },
  ])
    await assertFails(setDoc(target, { ...message(), ...fields }));
  await assertSucceeds(
    setDoc(
      doc(db("alice"), "chats", "alice:bob", "messages", "good"),
      message(),
    ),
  );
});

test("seenBy can only add self, cannot remove receipts, duplicate entries, or forge another member", async () => {
  await seed("chats/alice:bob/messages/one", message());
  const sender = doc(db("alice"), "chats", "alice:bob", "messages", "one"),
    recipient = doc(db("bob"), "chats", "alice:bob", "messages", "one");
  await assertFails(updateDoc(sender, { seenBy: ["alice", "bob"] }));
  await assertFails(updateDoc(recipient, { seenBy: ["bob"] }));
  await assertFails(updateDoc(recipient, { seenBy: ["alice", "bob", "bob"] }));
  await assertFails(updateDoc(recipient, { seenBy: ["alice", "eve"] }));
  await assertFails(updateDoc(recipient, { seenBy: "alice,bob" }));
  await assertSucceeds(updateDoc(recipient, { seenBy: ["alice", "bob"] }));
  await assertFails(updateDoc(sender, { seenBy: ["alice"] }));
});

test("only sender edits/deletes message and chat membership is immutable", async () => {
  await seed("chats/alice:bob/messages/one", message());
  await assertSucceeds(
    updateDoc(doc(db("alice"), "chats", "alice:bob", "messages", "one"), {
      text: "Düzenlendi",
      editedAt: serverTimestamp(),
    }),
  );
  await assertFails(
    updateDoc(doc(db("bob"), "chats", "alice:bob", "messages", "one"), {
      text: "Forged",
      editedAt: serverTimestamp(),
    }),
  );
  await assertFails(
    updateDoc(doc(db("alice"), "chats", "alice:bob"), {
      memberIds: ["alice", "eve"],
    }),
  );
  await assertFails(
    updateDoc(doc(db("alice"), "chats", "alice:bob", "messages", "one"), {
      senderUid: "bob",
    }),
  );
  await assertFails(
    deleteDoc(doc(db("bob"), "chats", "alice:bob", "messages", "one")),
  );
  await assertSucceeds(
    deleteDoc(doc(db("alice"), "chats", "alice:bob", "messages", "one")),
  );
});

test("blocking preserves member history while denying new messages, edits, and previews", async () => {
  await seed("chats/alice:bob/messages/one", message());
  await seed("users/bob/blocks/alice", { uid: "alice" });
  await assertSucceeds(
    getDoc(doc(db("alice"), "chats", "alice:bob", "messages", "one")),
  );
  await assertFails(
    setDoc(
      doc(db("alice"), "chats", "alice:bob", "messages", "bad"),
      message(),
    ),
  );
  await assertFails(
    setDoc(
      doc(db("bob"), "chats", "alice:bob", "messages", "reply"),
      message("bob"),
    ),
  );
  await assertFails(
    updateDoc(doc(db("alice"), "chats", "alice:bob", "messages", "one"), {
      text: "edit",
      editedAt: serverTimestamp(),
    }),
  );
  await assertFails(
    updateDoc(doc(db("alice"), "chats", "alice:bob"), {
      lastMessage: "bypass",
      lastMessageAt: serverTimestamp(),
    }),
  );
  await assertSucceeds(
    deleteDoc(doc(db("alice"), "chats", "alice:bob", "messages", "one")),
  );
});

test("follow notification requires deterministic ID and a newly created atomic relation", async () => {
  const database = db("alice");
  await assertSucceeds(getDoc(doc(database, "notifications", "alice_bob")));
  await assertFails(
    setDoc(doc(database, "notifications", "alice_bob"), notification()),
  );
  const bad = writeBatch(database);
  bad.set(doc(database, "follows", "alice_bob"), followData());
  bad.set(doc(database, "notifications", "random"), notification());
  await assertFails(bad.commit());
  const good = writeBatch(database);
  good.set(doc(database, "follows", "alice_bob"), followData());
  good.set(doc(database, "notifications", "alice_bob"), notification());
  await assertSucceeds(good.commit());
  await assertSucceeds(deleteDoc(doc(database, "notifications", "alice_bob")));
  await assertFails(
    setDoc(doc(database, "notifications", "alice_bob"), notification()),
  );
});

test("notification source/target cleanup is private; only target marks read", async () => {
  await seed("notifications/alice_bob", notification());
  await assertSucceeds(getDoc(doc(db("alice"), "notifications", "alice_bob")));
  await assertSucceeds(
    getDocs(
      query(
        collection(db("alice"), "notifications"),
        where("sourceUid", "==", "alice"),
      ),
    ),
  );
  await assertSucceeds(
    getDocs(
      query(
        collection(db("bob"), "notifications"),
        where("targetUid", "==", "bob"),
      ),
    ),
  );
  await assertFails(getDoc(doc(db("eve"), "notifications", "alice_bob")));
  await assertFails(
    updateDoc(doc(db("alice"), "notifications", "alice_bob"), { read: true }),
  );
  await assertFails(
    updateDoc(doc(db("bob"), "notifications", "alice_bob"), {
      text: "forged",
      read: true,
    }),
  );
  await assertSucceeds(
    updateDoc(doc(db("bob"), "notifications", "alice_bob"), { read: true }),
  );
  await assertFails(
    updateDoc(doc(db("bob"), "notifications", "alice_bob"), { read: false }),
  );
  await assertFails(deleteDoc(doc(db("eve"), "notifications", "alice_bob")));
  await assertSucceeds(
    deleteDoc(doc(db("alice"), "notifications", "alice_bob")),
  );
});

test("reports validate identity, target and reason; reporter can erase only own report", async () => {
  const valid = {
    reporterUid: "alice",
    targetUid: "bob",
    reason: "Uygunsuz içerik",
    createdAt: serverTimestamp(),
  };
  await assertSucceeds(setDoc(doc(db("alice"), "reports", "one"), valid));
  for (const fields of [
    { reporterUid: "eve" },
    { targetUid: "alice" },
    { targetUid: "missing" },
    { reason: "" },
    { reason: "x".repeat(501) },
  ])
    await assertFails(
      setDoc(doc(db("alice"), "reports", "bad"), { ...valid, ...fields }),
    );
  await assertSucceeds(
    getDocs(
      query(
        collection(db("alice"), "reports"),
        where("reporterUid", "==", "alice"),
      ),
    ),
  );
  await assertFails(getDoc(doc(db("bob"), "reports", "one")));
  await assertFails(deleteDoc(doc(db("bob"), "reports", "one")));
  await assertSucceeds(deleteDoc(doc(db("alice"), "reports", "one")));
});

test("account deletion marker is one-way, owner-only, and prevents new social writes", async () => {
  const own = doc(db("alice"), "users", "alice");
  await assertFails(
    updateDoc(doc(db("eve"), "users", "alice"), { deletionPending: true }),
  );
  await assertSucceeds(updateDoc(own, { deletionPending: true }));
  await assertFails(updateDoc(own, { deletionPending: false }));
  await assertFails(updateDoc(own, { bio: "cannot resume activity" }));
  await assertFails(setDoc(doc(db("alice"), "posts", "new"), post()));
  await assertFails(
    setDoc(doc(db("alice"), "follows", "alice_bob"), followData()),
  );
  await assertFails(
    setDoc(
      doc(db("eve"), "follows", "eve_alice"),
      followData("eve", "alice", "accepted"),
    ),
  );
  await assertFails(
    setDoc(
      doc(db("alice"), "chats", "alice:bob", "messages", "new"),
      message(),
    ),
  );
  await assertFails(
    setDoc(
      doc(db("bob"), "chats", "alice:bob", "messages", "new"),
      message("bob"),
    ),
  );
  await assertFails(
    setDoc(doc(db("eve"), "posts", "public", "likes", "eve"), {
      uid: "eve",
      createdAt: serverTimestamp(),
    }),
  );
  await assertSucceeds(deleteDoc(doc(db("alice"), "posts", "public")));
});

test("own reactions and messages remain queryable for erasure after private access is lost", async () => {
  await seed("posts/private/likes/alice", {
    uid: "alice",
    createdAt: serverTimestamp(),
  });
  await seed("posts/private/comments/own", {
    uid: "alice",
    username: "alice",
    text: "Own",
    createdAt: serverTimestamp(),
  });
  await seed("posts/private/comments/other", {
    uid: "eve",
    username: "eve",
    text: "Other",
    createdAt: serverTimestamp(),
  });
  await seed("chats/alice:bob/messages/own", message());
  for (const [group, field] of [
    ["likes", "uid"],
    ["comments", "uid"],
    ["messages", "senderUid"],
  ] as const) {
    const rows = await assertSucceeds(
      getDocs(
        query(collectionGroup(db("alice"), group), where(field, "==", "alice")),
      ),
    );
    assert.equal(rows.size, 1);
    await assertSucceeds(deleteDoc(rows.docs[0]!.ref));
    await assertFails(
      getDocs(
        query(
          collectionGroup(db("mallory"), group),
          where(field, "==", "alice"),
        ),
      ),
    );
  }
  await assertFails(
    deleteDoc(doc(db("alice"), "posts", "private", "comments", "other")),
  );
});

test("post owner can erase child reactions before parent; outsider cannot", async () => {
  await seed("posts/public/likes/eve", {
    uid: "eve",
    createdAt: serverTimestamp(),
  });
  await seed("posts/public/comments/eve", {
    uid: "eve",
    username: "eve",
    text: "Other",
    createdAt: serverTimestamp(),
  });
  await assertFails(
    deleteDoc(doc(db("bob"), "posts", "public", "likes", "eve")),
  );
  await assertSucceeds(
    deleteDoc(doc(db("alice"), "posts", "public", "likes", "eve")),
  );
  await assertSucceeds(
    deleteDoc(doc(db("alice"), "posts", "public", "comments", "eve")),
  );
  await assertSucceeds(deleteDoc(doc(db("alice"), "posts", "public")));
});

test("profile and username release atomically only for their authenticated owner", async () => {
  await assertFails(deleteDoc(doc(db("alice"), "users", "alice")));
  await assertFails(deleteDoc(doc(db("alice"), "usernames", "alice")));
  // authenticatedContext creates a new Firestore instance on each call.
  // Every document in a batch must come from that batch's own instance.
  const eveDatabase = db("eve");
  const evil = writeBatch(eveDatabase);
  evil.delete(doc(eveDatabase, "users", "alice"));
  evil.delete(doc(eveDatabase, "usernames", "alice"));
  await assertFails(evil.commit());
  await assertSucceeds(
    updateDoc(doc(db("alice"), "users", "alice"), { deletionPending: true }),
  );
  const aliceDatabase = db("alice");
  const own = writeBatch(aliceDatabase);
  own.delete(doc(aliceDatabase, "users", "alice"));
  own.delete(doc(aliceDatabase, "usernames", "alice"));
  await assertSucceeds(own.commit());
  await assertFails(setDoc(doc(db("alice"), "posts", "after"), post()));
});

test("deletion may clear only own chat previews while preserving membership and other history", async () => {
  await seed("chats/alice:bob/messages/other", message("bob"));
  await seed("users/bob/blocks/alice", { uid: "alice" });
  await assertSucceeds(
    updateDoc(doc(db("alice"), "users", "alice"), { deletionPending: true }),
  );
  const own = doc(db("alice"), "chats", "alice:bob");
  await assertSucceeds(
    updateDoc(own, { lastMessage: "", lastMessageAt: serverTimestamp() }),
  );
  await assertFails(
    updateDoc(own, { lastMessage: "forged", lastMessageAt: serverTimestamp() }),
  );
  await assertFails(
    updateDoc(own, {
      memberIds: ["alice", "eve"],
      lastMessage: "",
      lastMessageAt: serverTimestamp(),
    }),
  );
  await assertFails(
    deleteDoc(doc(db("alice"), "chats", "alice:bob", "messages", "other")),
  );
  await assertFails(deleteDoc(own));
  await assertSucceeds(
    getDoc(doc(db("bob"), "chats", "alice:bob", "messages", "other")),
  );
});

test("follow notification can reset only when a fresh follow is created, never on an existing relation", async () => {
  await seed("notifications/alice_bob", { ...notification(), read: true });
  await assertFails(
    updateDoc(doc(db("alice"), "notifications", "alice_bob"), notification()),
  );
  const database = db("alice"),
    batch = writeBatch(database);
  batch.set(doc(database, "follows", "alice_bob"), followData());
  batch.set(doc(database, "notifications", "alice_bob"), notification());
  await assertSucceeds(batch.commit());
  await assertFails(
    updateDoc(doc(database, "notifications", "alice_bob"), notification()),
  );
});

test("post reports must point at a visible post by their declared target account", async () => {
  const valid = {
    reporterUid: "eve",
    targetUid: "alice",
    reason: "Uygunsuz gönderi",
    postId: "public",
    createdAt: serverTimestamp(),
  };
  await assertSucceeds(setDoc(doc(db("eve"), "reports", "post"), valid));
  await assertFails(
    setDoc(doc(db("eve"), "reports", "wrongowner"), {
      ...valid,
      targetUid: "bob",
    }),
  );
  await assertFails(
    setDoc(doc(db("eve"), "reports", "missing"), {
      ...valid,
      postId: "missing",
    }),
  );
  await assertFails(
    setDoc(doc(db("eve"), "reports", "private"), {
      ...valid,
      targetUid: "bob",
      postId: "private",
    }),
  );
});
