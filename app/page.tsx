"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Post = {
  id: string;
  author: string;
  body: string;
  createdAt: string;
  likes: number;
  liked: boolean;
};

type Tab = "HOME" | "CREATE" | "FIND" | "CHAT" | "VAULT" | "YOU";

const starterPosts: Post[] = [
  {
    id: "welcome",
    author: "VORTEX",
    body: "Welcome to VORTEX. This is a real working social feed MVP. Create your profile, share posts, and connect with the community.",
    createdAt: new Date().toISOString(),
    likes: 42,
    liked: false,
  },
];

const tabs: Tab[] = ["HOME", "CREATE", "FIND", "CHAT", "VAULT", "YOU"];

function loadPosts(): Post[] {
  if (typeof window === "undefined") return starterPosts;
  try {
    const saved = window.localStorage.getItem("vortex-posts");
    return saved ? JSON.parse(saved) : starterPosts;
  } catch {
    return starterPosts;
  }
}

export default function VORTEX() {
  const [entered, setEntered] = useState(false);
  const [tab, setTab] = useState<Tab>("HOME");
  const [posts, setPosts] = useState<Post[]>([]);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setPosts(loadPosts());
    const saved = window.localStorage.getItem("vortex-name");
    if (saved) setName(saved);
  }, []);

  useEffect(() => {
    if (posts.length) {
      window.localStorage.setItem("vortex-posts", JSON.stringify(posts));
    }
  }, [posts]);

  function enterApp() {
    setEntered(true);
    if (!name) setTab("YOU");
  }

  function saveName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanName = name.trim().slice(0, 30);
    if (!cleanName) return;
    window.localStorage.setItem("vortex-name", cleanName);
    setTab("HOME");
  }

  function createPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanBody = body.trim().slice(0, 500);
    if (!cleanBody || !name.trim()) return;
    setPosts((current) => [
      {
        id: crypto.randomUUID(),
        author: name.trim(),
        body: cleanBody,
        createdAt: new Date().toISOString(),
        likes: 0,
        liked: false,
      },
      ...current,
    ]);
    setBody("");
    setTab("HOME");
  }

  function toggleLike(id: string) {
    setPosts((current) =>
      current.map((post) =>
        post.id === id
          ? {
              ...post,
              liked: !post.liked,
              likes: post.likes + (post.liked ? -1 : 1),
            }
          : post
      )
    );
  }

  const visiblePosts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query
      ? posts.filter((post) =>
          `${post.author} ${post.body}`.toLowerCase().includes(query)
        )
      : posts;
  }, [posts, search]);

  if (!entered) {
    return (
      <main style={styles.splash}>
        <div style={styles.logo}>VORTEX</div>
        <p style={styles.subtitle}>
          A real social space, built in Botswana.
        </p>
        <p style={styles.muted}>Post. Discover. Connect.</p>
        <button style={styles.primaryButton} onClick={enterApp}>
          Enter VORTEX →
        </button>
        <small style={styles.muted}>Early access MVP • v1.0.0</small>
      </main>
    );
  }

  if (!name && tab !== "YOU") setTab("YOU");

  return (
    <main style={styles.app}>
      <header style={styles.header}>
        <strong>VORTEX</strong>
        <span style={styles.live}>● LIVE MVP</span>
      </header>

      <section style={styles.content}>
        {tab === "YOU" && (
          <section style={styles.card}>
            <h1>Your Profile</h1>
            <p style={styles.muted}>
              Choose the name people will see on your posts.
            </p>
            <form onSubmit={saveName} style={styles.form}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your display name"
                maxLength={30}
                style={styles.input}
              />
              <button style={styles.primaryButton} type="submit">
                Save Profile
              </button>
            </form>
          </section>
        )}

        {tab === "HOME" && (
          <>
            <div style={styles.hero}>
              <h1>Community Feed</h1>
              <p style={styles.muted}>
                Real posts saved on this device.
              </p>
            </div>
            {visiblePosts.length === 0 ? (
              <div style={styles.card}>
                <p>No posts yet. Be the first to share!</p>
              </div>
            ) : (
              visiblePosts.map((post) => (
                <article style={styles.post} key={post.id}>
                  <strong>{post.author}</strong>
                  <small style={styles.muted}>
                    {" "}
                    · {new Date(post.createdAt).toLocaleString()}
                  </small>
                  <p>{post.body}</p>
                  <button
                    style={styles.linkButton}
                    onClick={() => toggleLike(post.id)}
                  >
                    {post.liked ? "❤️" : "🤍"} {post.likes} likes
                  </button>
                </article>
              ))
            )}
          </>
        )}

        {tab === "CREATE" && (
          <section style={styles.card}>
            <h1>Create a Post</h1>
            <form onSubmit={createPost} style={styles.form}>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="What is happening?"
                maxLength={500}
                rows={6}
                style={styles.textarea}
              />
              <button
                style={styles.primaryButton}
                type="submit"
                disabled={!name.trim() || !body.trim()}
              >
                Publish Post
              </button>
            </form>
            {!name && (
              <p style={styles.warning}>
                Create your profile first in YOU.
              </p>
            )}
          </section>
        )}

        {tab === "FIND" && (
          <section style={styles.card}>
            <h1>Find Posts</h1>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search people or posts"
              style={styles.input}
            />
            <p style={styles.muted}>{visiblePosts.length} result(s)</p>
          </section>
        )}

        {tab === "CHAT" && (
          <section style={styles.card}>
            <h1>Chat</h1>
            <p style={styles.muted}>
              Direct messaging is not connected yet. We removed the fake chat
              screen rather than pretending it works.
            </p>
          </section>
        )}

        {tab === "VAULT" && (
          <section style={styles.card}>
            <h1>Vault</h1>
            <p style={styles.muted}>
              Wallet features are disabled until a secure payment backend is
              connected. No fake balance is shown.
            </p>
          </section>
        )}
      </section>

      <nav style={styles.nav}>
        {tabs.map((item) => (
          <button
            key={item}
            onClick={() => setTab(item)}
            style={{
              ...styles.navButton,
              ...(tab === item ? styles.activeNav : {}),
            }}
          >
            {item}
          </button>
        ))}
      </nav>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  splash: {
    background: "#050505",
    color: "white",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    fontFamily: "system-ui",
    padding: 24,
    textAlign: "center",
  },
  app: {
    background: "#0a0a0a",
    color: "white",
    minHeight: "100vh",
    fontFamily: "system-ui",
    paddingBottom: 84,
  },
  header: {
    maxWidth: 720,
    margin: "auto",
    padding: "20px 20px 12px",
    display: "flex",
    justifyContent: "space-between",
    fontSize: 20,
  },
  content: {
    maxWidth: 720,
    margin: "auto",
    padding: "12px 20px",
  },
  logo: {
    fontSize: 48,
    fontWeight: 900,
    letterSpacing: -2,
  },
  subtitle: {
    fontSize: 18,
    margin: 0,
  },
  muted: {
    color: "#999",
    fontSize: 13,
  },
  live: {
    color: "#72e6a1",
    fontSize: 11,
  },
  hero: {
    margin: "12px 0 20px",
  },
  card: {
    background: "#151515",
    border: "1px solid #292929",
    borderRadius: 18,
    padding: 20,
    margin: "12px 0",
  },
  post: {
    background: "#151515",
    border: "1px solid #292929",
    borderRadius: 16,
    padding: 16,
    margin: "12px 0",
  },
  form: {
    display: "grid",
    gap: 12,
  },
  input: {
    background: "#0b0b0b",
    color: "white",
    border: "1px solid #444",
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    width: "100%",
    boxSizing: "border-box",
  },
  textarea: {
    background: "#0b0b0b",
    color: "white",
    border: "1px solid #444",
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    resize: "vertical",
  },
  primaryButton: {
    background: "#d4af37",
    color: "#111",
    border: "none",
    borderRadius: 999,
    padding: "14px 24px",
    fontWeight: 800,
    cursor: "pointer",
  },
  linkButton: {
    background: "none",
    color: "#d4af37",
    border: "none",
    padding: 0,
    cursor: "pointer",
  },
  warning: {
    color: "#f5c76b",
    fontSize: 13,
  },
  nav: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    background: "#050505",
    borderTop: "1px solid #292929",
    display: "flex",
    justifyContent: "center",
    gap: 4,
    padding: "10px 4px",
    zIndex: 2,
  },
  navButton: {
    background: "none",
    border: "none",
    color: "#777",
    padding: "10px 9px",
    fontSize: 11,
    cursor: "pointer",
  },
  activeNav: {
    color: "white",
    fontWeight: 800,
  },
};
