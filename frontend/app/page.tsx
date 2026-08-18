"use client";

import {
  FormEvent,
  ReactNode,
  KeyboardEvent,
  isValidElement,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";

import "highlight.js/styles/github-dark.css";
import "katex/dist/katex.min.css";

import { useRouter } from "next/navigation";

import BrandMark from "./components/BrandMark";
import SplashScreen from "./components/SplashScreen";
import { useAuth } from "./components/AuthProvider";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

/* =========================================================
   AUTH
========================================================= */

const getAuthHeaders = (
  extraHeaders: Record<string, string> = {},
) => {
  const token =
    typeof window !== "undefined"
      ? window.localStorage.getItem("nexora_token")
      : null;

  return {
    ...extraHeaders,
    ...(token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {}),
  };
};

/* =========================================================
   TYPES
========================================================= */

type Role = "user" | "assistant";

type CurrentUser = {
  id?: string;
  name: string;
  email: string;
};

type Message = {
  id?: string;
  role: Role;
  content: string;
};

type Conversation = {
  id: string;
  title: string;
  mode: string;
  createdAt?: string;
  updatedAt?: string;
};

type ChatMode =
  | "general"
  | "study"
  | "coding"
  | "math"
  | "career"
  | "interview";

/* =========================================================
   MODE CONFIG
========================================================= */

const MODE_CONFIG: Record<
  ChatMode,
  {
    label: string;
    welcomeTitle: string;
    welcomeDescription: string;
    suggestions: string[];
  }
> = {
  general: {
    label: "General",
    welcomeTitle: "What can I help you with?",
    welcomeDescription:
      "Ask anything, explore an idea, or start a conversation.",
    suggestions: [
      "Explain something to me",
      "Help me plan a project",
      "Give me some ideas",
      "Answer a question",
    ],
  },

  study: {
    label: "Study",
    welcomeTitle: "Let's make learning easier.",
    welcomeDescription:
      "Explain a topic, create notes, quiz me, or help me prepare for an exam.",
    suggestions: [
      "Explain a topic simply",
      "Make MCQs for me",
      "Create revision notes",
      "Quiz me",
    ],
  },

  coding: {
    label: "Coding",
    welcomeTitle: "Ready to code?",
    welcomeDescription:
      "Debug code, explain programming concepts, or build something together.",
    suggestions: [
      "Explain this code",
      "Debug my code",
      "Write a C++ program",
      "Help me build a project",
    ],
  },

  math: {
    label: "Math",
    welcomeTitle: "What can we solve today?",
    welcomeDescription:
      "Solve equations, understand formulas, or work through a math problem step by step.",
    suggestions: [
      "Solve an equation",
      "Explain this formula",
      "Solve step by step",
      "Help me with calculus",
    ],
  },

  career: {
    label: "Career",
    welcomeTitle: "Let's work on your career.",
    welcomeDescription:
      "Improve your CV, explore career paths, or build a practical skills roadmap.",
    suggestions: [
      "Improve my CV",
      "Build a career roadmap",
      "What skills should I learn?",
      "Prepare me for a job",
    ],
  },

  interview: {
    label: "Interview",
    welcomeTitle: "Ready for your interview?",
    welcomeDescription:
      "Practice technical questions, HR questions, or start a realistic mock interview.",
    suggestions: [
      "Start a mock interview",
      "Ask me technical questions",
      "Ask HR questions",
      "Review my interview answer",
    ],
  },
};

/* =========================================================
   ICON
========================================================= */

function Icon({
  name,
  className = "",
}: {
  name:
    | "plus"
    | "search"
    | "menu"
    | "close"
    | "edit"
    | "trash"
    | "copy"
    | "refresh"
    | "send"
    | "stop"
    | "spark";
  className?: string;
}) {
  const paths = {
    plus: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    ),

    search: (
      <>
        <circle cx="10.5" cy="10.5" r="5.5" />
        <path d="m15 15 4 4" />
      </>
    ),

    menu: <path d="M4 7h16M4 12h16M4 17h16" />,

    close: (
      <>
        <path d="m6 6 12 12" />
        <path d="M18 6 6 18" />
      </>
    ),

    edit: (
      <>
        <path d="m5 15 1.1-4.1L15.7 1.3a2 2 0 0 1 2.8 2.8L8.9 13.7 5 15Z" />
        <path d="m13.5 3.5 2.9 2.9" />
      </>
    ),

    trash: (
      <>
        <path d="M5 7h14M9 7V4h6v3M7 7l.7 12h8.6L17 7" />
        <path d="M10 10v6M14 10v6" />
      </>
    ),

    copy: (
      <>
        <rect x="8" y="8" width="10" height="10" rx="2" />
        <path d="M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" />
      </>
    ),

    refresh: (
      <>
        <path d="M18 9V4" />
        <path d="M18 4h-5" />
        <path d="m18 4-3.5 3.5A7 7 0 1 0 19 14" />
      </>
    ),

    send: <path d="m3 3 17 9-17 9 3-9-3-9Zm3 9h7" />,

    stop: (
      <rect
        x="6"
        y="6"
        width="12"
        height="12"
        rx="2"
        fill="currentColor"
        stroke="none"
      />
    ),

    spark: (
      <path d="m12 2 1.9 7.1L21 11l-7.1 1.9L12 20l-1.9-7.1L3 11l7.1-1.9L12 2Z" />
    ),
  };

  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

/* =========================================================
   CODE BLOCK
========================================================= */

function CodeBlock({
  children,
}: {
  children?: ReactNode;
}) {
  const [copied, setCopied] = useState(false);

  const codeElement = isValidElement<{
    children?: ReactNode;
    className?: string;
  }>(children)
    ? children
    : null;

  const language =
    codeElement?.props.className?.replace(
      "language-",
      "",
    ) || "code";

  const text = String(
    codeElement?.props.children ?? "",
  ).replace(/\n$/, "");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1600);
    } catch (error) {
      console.error("Code copy failed:", error);
    }
  };

  return (
    <div className="code-block">
      <div className="code-block__bar">
        <span>{language}</span>

        <button
          type="button"
          onClick={copy}
          title="Copy code"
          aria-label="Copy code"
        >
          <Icon
            name="copy"
            className="h-3.5 w-3.5"
          />

          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <pre>{children}</pre>
    </div>
  );
}

/* =========================================================
   MARKDOWN TABLE COMPONENTS
   (adds proper HTML table rendering + responsive overflow
   for GFM tables, without altering the app's design system)
========================================================= */

function MarkdownTable({
  children,
}: {
  children?: ReactNode;
}) {
  return (
    <div className="markdown-table-wrapper">
      <table className="markdown-table">
        {children}
      </table>
    </div>
  );
}

function MarkdownTableHead({
  children,
}: {
  children?: ReactNode;
}) {
  return <thead className="markdown-table__head">{children}</thead>;
}

function MarkdownTableBody({
  children,
}: {
  children?: ReactNode;
}) {
  return <tbody className="markdown-table__body">{children}</tbody>;
}

function MarkdownTableRow({
  children,
}: {
  children?: ReactNode;
}) {
  return <tr className="markdown-table__row">{children}</tr>;
}

function MarkdownTableHeaderCell({
  children,
}: {
  children?: ReactNode;
}) {
  return <th className="markdown-table__th">{children}</th>;
}

function MarkdownTableCell({
  children,
}: {
  children?: ReactNode;
}) {
  return <td className="markdown-table__td">{children}</td>;
}

/* =========================================================
   HOME
========================================================= */

export default function Home() {
  const router = useRouter();

  const {
    user: authUser,
    logout: authLogout,
  } = useAuth();

  const [sessionReady, setSessionReady] =
    useState(false);

  const [showSplash, setShowSplash] =
    useState(true);

  const [conversations, setConversations] =
    useState<Conversation[]>([]);

  const [conversationId, setConversationId] =
    useState<string | null>(null);

  const [messages, setMessages] =
    useState<Message[]>([]);

  const [input, setInput] = useState("");

  const [mode, setMode] =
    useState<ChatMode>("general");

  const [loading, setLoading] =
    useState(false);

  const [loadingHistory, setLoadingHistory] =
    useState(false);

  const [
    editingMessageId,
    setEditingMessageId,
  ] = useState<string | null>(null);

  const [editingText, setEditingText] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [currentUser, setCurrentUser] =
    useState<CurrentUser | null>(null);

  const [attachment, setAttachment] =
    useState<{
      id: string;
      name: string;
      mimeType: string;
      size: number;
      status: string;
    } | null>(null);

  const [isListening, setIsListening] =
    useState(false);

  const [voiceMessage, setVoiceMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const abortControllerRef =
    useRef<AbortController | null>(null);

  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  const recognitionRef =
    useRef<any>(null);

  const lastVoiceTranscriptRef =
    useRef<string>("");

  const messagesEndRef =
    useRef<HTMLDivElement | null>(null);

  /* =========================================================
     AUTH HELPERS
  ========================================================= */

  const clearAuthState = useCallback(() => {
    setCurrentUser(null);

    if (typeof window !== "undefined") {
      window.localStorage.removeItem(
        "nexora_token",
      );
    }
  }, []);

  const redirectToLogin = useCallback(() => {
    clearAuthState();

    router.replace("/login");
  }, [
    clearAuthState,
    router,
  ]);

  /* =========================================================
     FILE HELPERS
  ========================================================= */

  const formatFileSize = (
    size: number,
  ) => {
    if (size < 1024) {
      return `${size} B`;
    }

    if (size < 1024 * 1024) {
      return `${(
        size / 1024
      ).toFixed(1)} KB`;
    }

    return `${(
      size /
      (1024 * 1024)
    ).toFixed(1)} MB`;
  };

  const getFileIcon = (
    mimeType: string,
  ) => {
    if (mimeType.includes("pdf")) {
      return "PDF";
    }

    if (
      mimeType.includes("word") ||
      mimeType.includes("doc")
    ) {
      return "DOC";
    }

    if (
      mimeType.includes("sheet") ||
      mimeType.includes("excel") ||
      mimeType.includes("csv")
    ) {
      return "CSV";
    }

    if (mimeType.includes("image")) {
      return "IMG";
    }

    if (mimeType.includes("text")) {
      return "TXT";
    }

    return "FILE";
  };

  /* =========================================================
     SESSION VALIDATION
  ========================================================= */

  useEffect(() => {
    const token =
      window.localStorage.getItem(
        "nexora_token",
      );

    if (!token) {
      redirectToLogin();
      return;
    }

    const originalFetch =
      window.fetch.bind(window);

    const authenticatedFetch: typeof window.fetch =
      (
        input,
        init = {},
      ) => {
        const isApi =
          typeof input === "string" &&
          input.startsWith(API_URL);

        if (!isApi) {
          return originalFetch(
            input,
            init,
          );
        }

        return originalFetch(
          input,
          {
            ...init,

            headers: {
              ...(init.headers || {}),

              Authorization: `Bearer ${token}`,
            },
          },
        ).then((response) => {
          if (
            response.status === 401
          ) {
            clearAuthState();

            router.replace(
              "/login",
            );
          }

          return response;
        });
      };

    window.fetch =
      authenticatedFetch;

    originalFetch(
      `${API_URL}/auth/me`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )
      .then(async (response) => {
        if (
          response.status === 401
        ) {
          clearAuthState();

          router.replace(
            "/login",
          );

          return;
        }

        if (!response.ok) {
          throw new Error(
            "Session validation failed.",
          );
        }

        const data =
          await response.json();

        setCurrentUser(data);
        setSessionReady(true);
      })
      .catch((err) => {
        console.error(
          "Session validation error:",
          err,
        );

        clearAuthState();

        router.replace("/login");
      });

    return () => {
      window.fetch =
        originalFetch;
    };
  }, [
    clearAuthState,
    redirectToLogin,
    router,
  ]);

  /* =========================================================
     LOGOUT
  ========================================================= */

  const handleLogout = async () => {
    try {
      await authLogout();
    } catch (error) {
      console.error(
        "Logout error:",
        error,
      );

      clearAuthState();
      router.replace("/login");
    }
  };

  /* =========================================================
     SCROLL
  ========================================================= */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView(
      {
        behavior: "smooth",
      },
    );
  }, [messages]);

  /* =========================================================
     LOAD CONVERSATIONS
  ========================================================= */

  const loadConversations =
    useCallback(async () => {
      try {
        setLoadingHistory(true);
        setError("");

        const response =
          await fetch(
            `${API_URL}/conversations`,
            {
              cache: "no-store",
              headers:
                getAuthHeaders(),
            },
          );

        if (
          response.status === 401 ||
          response.status === 403
        ) {
          clearAuthState();

          router.replace(
            "/login",
          );

          throw new Error(
            "Your session expired. Please sign in again.",
          );
        }

        if (!response.ok) {
          let detail = "";

          try {
            detail =
              await response.text();
          } catch {}

          throw new Error(
            `Unable to load conversations (${response.status}): ${
              detail || "Unknown error"
            }`,
          );
        }

        const data =
          await response.json();

        setConversations(
          Array.isArray(data)
            ? data
            : [],
        );
      } catch (err) {
        console.error(
          "Conversation history error:",
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load conversations.",
        );
      } finally {
        setLoadingHistory(false);
      }
    }, [
      clearAuthState,
      router,
    ]);

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    if (sessionReady) {
      void loadConversations();
    }
  }, [
    sessionReady,
    loadConversations,
  ]);

  /* =========================================================
     CREATE CONVERSATION
  ========================================================= */

  const createConversation =
    async (
      nextMode: ChatMode = mode,
    ): Promise<Conversation> => {
      const response =
        await fetch(
          `${API_URL}/conversations`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              ...getAuthHeaders(),
            },

            body: JSON.stringify({
              mode: nextMode,
            }),
          },
        );

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        clearAuthState();

        router.replace(
          "/login",
        );

        throw new Error(
          "Your session expired. Please sign in again.",
        );
      }

      if (!response.ok) {
        let detail = "";

        try {
          const data =
            await response.json();

          detail =
            data?.message ||
            data?.error ||
            "";
        } catch {
          try {
            detail =
              await response.text();
          } catch {}
        }

        throw new Error(
          `Unable to create conversation (${response.status}): ${
            detail || "Unknown error"
          }`,
        );
      }

      const conversation =
        await response.json();

      setConversations(
        (prev) => [
          conversation,

          ...prev.filter(
            (item) =>
              item.id !==
              conversation.id,
          ),
        ],
      );

      setConversationId(
        conversation.id,
      );

      return conversation;
    };

  /* =========================================================
     NEW CHAT
  ========================================================= */

  const handleNewChat =
    async () => {
      try {
        setError("");

        const conversation =
          await createConversation(
            mode,
          );

        setConversationId(
          conversation.id,
        );

        setMessages([]);

        setInput("");

        setAttachment(null);

        setSidebarOpen(false);
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to create a new chat.",
        );
      }
    };

  /* =========================================================
     CHANGE MODE
  ========================================================= */

  const handleModeChange =
    async (
      nextMode: ChatMode,
    ) => {
      if (
        nextMode === mode ||
        loading
      ) {
        return;
      }

      const previousMode =
        mode;

      try {
        setError("");

        setMode(nextMode);

        const conversation =
          await createConversation(
            nextMode,
          );

        setConversationId(
          conversation.id,
        );

        setMessages([]);

        setInput("");

        setAttachment(null);

        await loadConversations();
      } catch (err) {
        console.error(err);

        setMode(previousMode);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to create a new conversation for this mode.",
        );
      }
    };

  /* =========================================================
     OPEN CONVERSATION
  ========================================================= */

  const openConversation =
    async (id: string) => {
      try {
        setError("");

        const response =
          await fetch(
            `${API_URL}/conversations/${id}`,
            {
              cache: "no-store",
              headers:
                getAuthHeaders(),
            },
          );

        if (
          response.status === 401 ||
          response.status === 403
        ) {
          clearAuthState();

          router.replace(
            "/login",
          );

          throw new Error(
            "Your session expired. Please sign in again.",
          );
        }

        if (!response.ok) {
          throw new Error(
            `Unable to open conversation (${response.status}).`,
          );
        }

        const data =
          await response.json();

        setConversationId(
          data.id,
        );

        setMessages(
          Array.isArray(
            data.messages,
          )
            ? data.messages.map(
                (
                  message: any,
                ) => ({
                  id: message.id,
                  role:
                    message.role,
                  content:
                    message.content,
                }),
              )
            : [],
        );

        setMode(
          (data.mode ||
            "general") as ChatMode,
        );

        setSidebarOpen(false);
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to open conversation.",
        );
      }
    };

  /* =========================================================
     RENAME
  ========================================================= */

  const renameConversation =
    async (
      conversation: Conversation,
    ) => {
      const newTitle =
        window.prompt(
          "Enter new conversation name:",
          conversation.title,
        );

      if (
        newTitle === null
      ) {
        return;
      }

      const title =
        newTitle.trim();

      if (!title) {
        return;
      }

      try {
        setError("");

        const response =
          await fetch(
            `${API_URL}/conversations/${conversation.id}`,
            {
              method: "PATCH",

              headers: {
                "Content-Type":
                  "application/json",

                ...getAuthHeaders(),
              },

              body: JSON.stringify({
                title,
              }),
            },
          );

        if (
          response.status === 401 ||
          response.status === 403
        ) {
          clearAuthState();

          router.replace(
            "/login",
          );

          return;
        }

        if (!response.ok) {
          throw new Error(
            `Unable to rename conversation (${response.status}).`,
          );
        }

        const updated =
          await response.json();

        setConversations(
          (prev) =>
            prev.map(
              (item) =>
                item.id ===
                conversation.id
                  ? updated
                  : item,
            ),
        );
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to rename conversation.",
        );
      }
    };

  /* =========================================================
     DELETE
  ========================================================= */

  const deleteConversation =
    async (
      id: string,
    ) => {
      const confirmed =
        window.confirm(
          "Delete this conversation?",
        );

      if (!confirmed) {
        return;
      }

      try {
        setError("");

        const response =
          await fetch(
            `${API_URL}/conversations/${id}`,
            {
              method: "DELETE",

              headers:
                getAuthHeaders(),
            },
          );

        if (
          response.status === 401 ||
          response.status === 403
        ) {
          clearAuthState();

          router.replace(
            "/login",
          );

          return;
        }

        if (!response.ok) {
          throw new Error(
            `Unable to delete conversation (${response.status}).`,
          );
        }

        setConversations(
          (prev) =>
            prev.filter(
              (
                conversation,
              ) =>
                conversation.id !==
                id,
            ),
        );

        if (
          conversationId ===
          id
        ) {
          setConversationId(
            null,
          );

          setMessages([]);
        }
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to delete conversation.",
        );
      }
    };

  /* =========================================================
     SAVE MESSAGE
  ========================================================= */

  const saveMessage =
    async (
      id: string,
      role: Role,
      content: string,
      attachmentId?: string,
    ) => {
      const response =
        await fetch(
          `${API_URL}/messages`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              ...getAuthHeaders(),
            },

            body: JSON.stringify({
              conversationId: id,
              role,
              content,
              attachmentId,
            }),
          },
        );

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        clearAuthState();

        router.replace(
          "/login",
        );

        throw new Error(
          "Your session expired. Please sign in again.",
        );
      }

      if (!response.ok) {
        let detail = "";

        try {
          const data =
            await response.json();

          detail =
            data?.message ||
            data?.error ||
            "";
        } catch {
          try {
            detail =
              await response.text();
          } catch {}
        }

        throw new Error(
          `Unable to save message (${response.status}): ${
            detail || "Unknown error"
          }`,
        );
      }

      return response.json();
    };

  /* =========================================================
     FILE UPLOAD
  ========================================================= */

  const handleFileUpload =
    async (
      event: React.ChangeEvent<HTMLInputElement>,
    ) => {
      const file =
        event.target.files?.[0];

      if (!file) {
        return;
      }

      const allowedTypes = [
        "application/pdf",
        "text/plain",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/csv",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "image/png",
        "image/jpeg",
        "image/webp",
      ];

      const extension =
        file.name
          .split(".")
          .pop()
          ?.toLowerCase();

      const acceptedExt = [
        "pdf",
        "txt",
        "docx",
        "csv",
        "xlsx",
        "xls",
        "png",
        "jpg",
        "jpeg",
        "webp",
      ];

      if (
        file.size >
        10 * 1024 * 1024
      ) {
        setError(
          "File must be 10 MB or smaller.",
        );

        event.target.value =
          "";

        return;
      }

      if (
        !allowedTypes.includes(
          file.type,
        ) &&
        !acceptedExt.includes(
          extension || "",
        )
      ) {
        setError(
          "Unsupported file type. Please upload PDF, TXT, DOCX, CSV, XLSX, JPG, PNG, or WEBP.",
        );

        event.target.value =
          "";

        return;
      }

      try {
        setError("");

        const token =
          window.localStorage.getItem(
            "nexora_token",
          );

        const formData =
          new FormData();

        formData.append(
          "file",
          file,
        );

        const response =
          await fetch(
            `${API_URL}/files/upload`,
            {
              method: "POST",

              headers: token
                ? {
                    Authorization: `Bearer ${token}`,
                  }
                : {},

              body: formData,
            },
          );

        if (
          response.status === 401 ||
          response.status === 403
        ) {
          clearAuthState();

          router.replace(
            "/login",
          );

          return;
        }

        if (!response.ok) {
          let detail = "";

          try {
            const errorData =
              await response.json();

            detail =
              errorData?.message ||
              errorData?.error ||
              "";
          } catch {
            try {
              detail =
                await response.text();
            } catch {}
          }

          throw new Error(
            detail ||
              `Upload failed (${response.status}).`,
          );
        }

        const data =
          await response.json();

        setAttachment({
          id: data.id,
          name: data.name,
          mimeType: data.mimeType,
          size: data.size,
          status: data.status,
        });

        setError("");
      } catch (err: any) {
        console.error(
          "File upload error:",
          err,
        );

        setError(
          err?.message ||
            "Upload failed.",
        );

        setAttachment(null);
      } finally {
        if (event.target) {
          event.target.value =
            "";
        }
      }
    };

  /* =========================================================
     VOICE INPUT
  ========================================================= */

  const stopVoiceInput =
    useCallback(() => {
      const recognition =
        recognitionRef.current;

      if (!recognition) {
        setIsListening(false);
        setVoiceMessage("");

        lastVoiceTranscriptRef.current =
          "";

        return;
      }

      try {
        recognition.onresult =
          null;

        recognition.onstart =
          null;

        recognition.onerror =
          null;

        recognition.onend =
          null;

        recognition.stop();
      } catch {
        // Ignore stale recognition errors.
      } finally {
        recognitionRef.current =
          null;

        setIsListening(false);

        setVoiceMessage("");

        lastVoiceTranscriptRef.current =
          "";
      }
    }, []);

  useEffect(() => {
    return () => {
      stopVoiceInput();
    };
  }, [stopVoiceInput]);

  const toggleVoiceInput =
    () => {
      if (
        typeof window ===
        "undefined"
      ) {
        return;
      }

      const SpeechRecognitionCtor =
        (window as any)
          .SpeechRecognition ||
        (window as any)
          .webkitSpeechRecognition;

      if (
        !SpeechRecognitionCtor
      ) {
        setError(
          "Voice input isn't supported in this browser.",
        );

        return;
      }

      if (
        recognitionRef.current ||
        isListening
      ) {
        stopVoiceInput();
        return;
      }

      try {
        const recognition =
          new SpeechRecognitionCtor();

        recognitionRef.current =
          recognition;

        recognition.lang =
          "en-US";

        recognition.continuous =
          false;

        recognition.interimResults =
          true;

        recognition.onstart =
          () => {
            lastVoiceTranscriptRef.current =
              "";

            setVoiceMessage(
              "Listening…",
            );

            setIsListening(
              true,
            );

            setError("");
          };

        recognition.onresult =
          (event: any) => {
            const results =
              event?.results;

            if (
              !results ||
              results.length ===
                0
            ) {
              return;
            }

            const latestResult =
              results[
                results.length - 1
              ];

            const transcript =
              latestResult?.[0]?.transcript?.trim() ??
              "";

            if (!transcript) {
              return;
            }

            if (
              latestResult.isFinal
            ) {
              if (
                lastVoiceTranscriptRef.current ===
                transcript
              ) {
                return;
              }

              lastVoiceTranscriptRef.current =
                transcript;

              setVoiceMessage(
                transcript,
              );

              setInput(
                (
                  currentText,
                ) => {
                  const nextText =
                    currentText.trim();

                  return nextText
                    ? `${nextText} ${transcript}`.trim()
                    : transcript;
                },
              );

              return;
            }

            setVoiceMessage(
              transcript,
            );
          };

        recognition.onerror =
          (event: any) => {
            if (
              event.error ===
                "not-allowed" ||
              event.error ===
                "permission-denied"
            ) {
              setError(
                "Microphone permission was denied.",
              );
            } else if (
              event.error ===
              "no-speech"
            ) {
              setError(
                "No speech detected. Please try again.",
              );
            } else {
              setError(
                "Voice input is unavailable right now.",
              );
            }

            stopVoiceInput();
          };

        recognition.onend =
          () => {
            if (
              recognitionRef.current ===
              recognition
            ) {
              recognitionRef.current =
                null;
            }

            setIsListening(
              false,
            );

            setVoiceMessage("");

            lastVoiceTranscriptRef.current =
              "";
          };

        recognition.start();
      } catch (err) {
        console.error(
          "Voice start error:",
          err,
        );

        setError(
          "Voice input could not be started.",
        );

        stopVoiceInput();
      }
    };

  /* =========================================================
     AI ERROR READER
  ========================================================= */

  const getApiErrorMessage =
    async (
      response: Response,
    ): Promise<string> => {
      let detail = "";

      try {
        const contentType =
          response.headers.get(
            "content-type",
          ) || "";

        if (
          contentType.includes(
            "application/json",
          )
        ) {
          const errorData =
            await response.json();

          if (
            Array.isArray(
              errorData?.message,
            )
          ) {
            detail =
              errorData.message.join(
                ", ",
              );
          } else {
            detail =
              errorData?.message ||
              errorData?.error ||
              errorData?.detail ||
              JSON.stringify(
                errorData,
              );
          }
        } else {
          detail =
            await response.text();
        }
      } catch {
        detail = "";
      }

      return (
        detail ||
        response.statusText ||
        "Unknown backend error"
      );
    };

  /* =========================================================
     SEND MESSAGE
  ========================================================= */

  const sendMessage =
    async (
      e?: FormEvent<HTMLFormElement>,
    ) => {
      e?.preventDefault();

      const trimmedMessage =
        input.trim();

      const currentAttachment =
        attachment;

      const effectiveMessage =
        trimmedMessage ||
        (currentAttachment
          ? "Review the attached document."
          : "");

      if (
        (!effectiveMessage &&
          !currentAttachment) ||
        loading
      ) {
        return;
      }

      try {
        setError("");
        setLoading(true);

        /* -----------------------------------------------
           CREATE CONVERSATION
        ------------------------------------------------ */

        let activeConversationId =
          conversationId;

        if (
          !activeConversationId
        ) {
          const conversation =
            await createConversation(
              mode,
            );

          activeConversationId =
            conversation.id;

          setConversationId(
            conversation.id,
          );
        }

        /* -----------------------------------------------
           USER MESSAGE
        ------------------------------------------------ */

        const userMessage: Message =
          {
            role: "user",
            content:
              effectiveMessage,
          };

        setMessages(
          (prev) => [
            ...prev,
            userMessage,
          ],
        );

        setInput("");

        setAttachment(null);

        /* -----------------------------------------------
           SAVE USER MESSAGE
        ------------------------------------------------ */

        await saveMessage(
          activeConversationId,
          "user",
          effectiveMessage,
          currentAttachment?.id,
        );

        /* -----------------------------------------------
           ASSISTANT PLACEHOLDER
        ------------------------------------------------ */

        setMessages(
          (prev) => [
            ...prev,
            {
              role: "assistant",
              content: "",
            },
          ],
        );

        /* -----------------------------------------------
           ABORT CONTROLLER
        ------------------------------------------------ */

        const controller =
          new AbortController();

        abortControllerRef.current =
          controller;

        /* -----------------------------------------------
           AI REQUEST
        ------------------------------------------------ */

        const response =
          await fetch(
            `${API_URL}/ai/chat`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",

                ...getAuthHeaders(),
              },

              signal:
                controller.signal,

              body: JSON.stringify({
                message:
                  effectiveMessage,

                mode,

                conversationId:
                  activeConversationId,

                attachmentId:
                  currentAttachment?.id,
              }),
            },
          );

        /* -----------------------------------------------
           AUTH ERROR
        ------------------------------------------------ */

        if (
          response.status ===
            401 ||
          response.status ===
            403
        ) {
          clearAuthState();

          router.replace(
            "/login",
          );

          throw new Error(
            "Your session expired. Please sign in again.",
          );
        }

        /* -----------------------------------------------
           BACKEND ERROR
        ------------------------------------------------ */

        if (!response.ok) {
          const detail =
            await getApiErrorMessage(
              response,
            );

          console.error(
            "NEXORA /ai/chat ERROR:",
            {
              status:
                response.status,

              statusText:
                response.statusText,

              detail,
            },
          );

          throw new Error(
            `Nexora AI error (${response.status}): ${detail}`,
          );
        }

        /* -----------------------------------------------
           STREAM CHECK
        ------------------------------------------------ */

        if (!response.body) {
          throw new Error(
            "Nexora AI returned no response stream.",
          );
        }

        /* -----------------------------------------------
           STREAM
        ------------------------------------------------ */

        const reader =
          response.body.getReader();

        const decoder =
          new TextDecoder();

        let assistantText = "";

        while (true) {
          const {
            value,
            done,
          } = await reader.read();

          if (done) {
            break;
          }

          const chunk =
            decoder.decode(
              value,
              {
                stream: true,
              },
            );

          if (!chunk) {
            continue;
          }

          assistantText +=
            chunk;

          setMessages(
            (prev) => {
              const updated =
                [...prev];

              const lastIndex =
                updated.length -
                1;

              if (
                lastIndex >=
                  0 &&
                updated[
                  lastIndex
                ].role ===
                  "assistant"
              ) {
                updated[
                  lastIndex
                ] = {
                  ...updated[
                    lastIndex
                  ],

                  content:
                    assistantText,
                };
              }

              return updated;
            },
          );
        }

        /* -----------------------------------------------
           FLUSH DECODER
        ------------------------------------------------ */

        const finalChunk =
          decoder.decode();

        if (finalChunk) {
          assistantText +=
            finalChunk;

          setMessages(
            (prev) => {
              const updated =
                [...prev];

              const lastIndex =
                updated.length -
                1;

              if (
                lastIndex >=
                  0 &&
                updated[
                  lastIndex
                ].role ===
                  "assistant"
              ) {
                updated[
                  lastIndex
                ] = {
                  ...updated[
                    lastIndex
                  ],

                  content:
                    assistantText,
                };
              }

              return updated;
            },
          );
        }

        /* -----------------------------------------------
           SAVE AI RESPONSE
        ------------------------------------------------ */

        if (
          assistantText.trim()
        ) {
          await saveMessage(
            activeConversationId,
            "assistant",
            assistantText,
          );
        }

        /* -----------------------------------------------
           REFRESH SIDEBAR
        ------------------------------------------------ */

        await loadConversations();
      } catch (err: any) {
        if (
          err?.name ===
          "AbortError"
        ) {
          return;
        }

        console.error(
          "Send message error:",
          err,
        );

        setMessages(
          (prev) => {
            const updated =
              [...prev];

            const lastIndex =
              updated.length -
              1;

            if (
              lastIndex >=
                0 &&
              updated[
                lastIndex
              ].role ===
                "assistant" &&
              !updated[
                lastIndex
              ].content
            ) {
              updated.pop();
            }

            return updated;
          },
        );

        setError(
          err?.message ||
            "Something went wrong while contacting Nexora.",
        );
      } finally {
        setLoading(false);

        abortControllerRef.current =
          null;
      }
    };

  /* =========================================================
     STOP GENERATING
  ========================================================= */

  const stopGenerating =
    () => {
      abortControllerRef.current?.abort();

      setLoading(false);
    };

  /* =========================================================
     COPY
  ========================================================= */

  const copyResponse =
    async (
      content: string,
    ) => {
      try {
        await navigator.clipboard.writeText(
          content,
        );
      } catch (err) {
        console.error(
          "Copy failed:",
          err,
        );
      }
    };

  /* =========================================================
     REGENERATE
  ========================================================= */

  const regenerateResponse =
    async (
      index: number,
    ) => {
      if (loading) {
        return;
      }

      const assistantMessage =
        messages[index];

      if (
        !assistantMessage ||
        assistantMessage.role !==
          "assistant"
      ) {
        return;
      }

      const previousUser =
        messages[index - 1];

      if (
        !previousUser ||
        previousUser.role !==
          "user"
      ) {
        return;
      }

      const activeConversationId =
        conversationId;

      if (!activeConversationId) {
        setError(
          "No active conversation.",
        );

        return;
      }

      try {
        setLoading(true);
        setError("");

        setMessages(
          (prev) =>
            prev.map(
              (
                message,
                i,
              ) =>
                i === index
                  ? {
                      ...message,
                      content: "",
                    }
                  : message,
            ),
        );

        const controller =
          new AbortController();

        abortControllerRef.current =
          controller;

        const response =
          await fetch(
            `${API_URL}/ai/chat`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",

                ...getAuthHeaders(),
              },

              signal:
                controller.signal,

              body: JSON.stringify({
                message:
                  previousUser.content,

                mode,

                conversationId:
                  activeConversationId,
              }),
            },
          );

        if (
          response.status ===
            401 ||
          response.status ===
            403
        ) {
          clearAuthState();

          router.replace(
            "/login",
          );

          throw new Error(
            "Your session expired. Please sign in again.",
          );
        }

        if (!response.ok) {
          const detail =
            await getApiErrorMessage(
              response,
            );

          console.error(
            "NEXORA REGENERATE ERROR:",
            {
              status:
                response.status,

              detail,
            },
          );

          throw new Error(
            `Unable to regenerate response (${response.status}): ${detail}`,
          );
        }

        if (!response.body) {
          throw new Error(
            "Nexora returned no response stream.",
          );
        }

        const reader =
          response.body.getReader();

        const decoder =
          new TextDecoder();

        let text = "";

        while (true) {
          const {
            value,
            done,
          } = await reader.read();

          if (done) {
            break;
          }

          const chunk =
            decoder.decode(
              value,
              {
                stream: true,
              },
            );

          if (!chunk) {
            continue;
          }

          text += chunk;

          setMessages(
            (prev) =>
              prev.map(
                (
                  message,
                  i,
                ) =>
                  i === index
                    ? {
                        ...message,
                        content: text,
                      }
                    : message,
              ),
          );
        }

        const finalChunk =
          decoder.decode();

        if (finalChunk) {
          text += finalChunk;

          setMessages(
            (prev) =>
              prev.map(
                (
                  message,
                  i,
                ) =>
                  i === index
                    ? {
                        ...message,
                        content: text,
                      }
                    : message,
              ),
          );
        }

        if (text.trim()) {
          await saveMessage(
            activeConversationId,
            "assistant",
            text,
          );
        }

        await loadConversations();
      } catch (err: any) {
        if (
          err?.name !==
          "AbortError"
        ) {
          console.error(
            "Regenerate response error:",
            err,
          );

          setError(
            err?.message ||
              "Unable to regenerate response.",
          );
        }
      } finally {
        setLoading(false);

        abortControllerRef.current =
          null;
      }
    };

  /* =========================================================
     EDIT MESSAGE
  ========================================================= */

  const startEditing =
    (
      message: Message,
    ) => {
      setEditingMessageId(
        message.id ||
          message.content,
      );

      setEditingText(
        message.content,
      );
    };

  /* =========================================================
     SEND DIRECT TEXT
  ========================================================= */

  const sendMessageWithText =
    async (
      text: string,
    ) => {
      const trimmedText =
        text.trim();

      if (
        !trimmedText ||
        loading
      ) {
        return;
      }

      try {
        setError("");
        setLoading(true);

        let activeConversationId =
          conversationId;

        if (
          !activeConversationId
        ) {
          const conversation =
            await createConversation(
              mode,
            );

          activeConversationId =
            conversation.id;

          setConversationId(
            conversation.id,
          );
        }

        setMessages(
          (prev) => [
            ...prev,

            {
              role: "user",
              content:
                trimmedText,
            },

            {
              role: "assistant",
              content: "",
            },
          ],
        );

        await saveMessage(
          activeConversationId,
          "user",
          trimmedText,
        );

        const controller =
          new AbortController();

        abortControllerRef.current =
          controller;

        const response =
          await fetch(
            `${API_URL}/ai/chat`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",

                ...getAuthHeaders(),
              },

              signal:
                controller.signal,

              body: JSON.stringify({
                message:
                  trimmedText,

                mode,

                conversationId:
                  activeConversationId,
              }),
            },
          );

        if (
          response.status ===
            401 ||
          response.status ===
            403
        ) {
          clearAuthState();

          router.replace(
            "/login",
          );

          throw new Error(
            "Your session expired. Please sign in again.",
          );
        }

        if (!response.ok) {
          const detail =
            await getApiErrorMessage(
              response,
            );

          console.error(
            "NEXORA EDIT/RESEND ERROR:",
            {
              status:
                response.status,

              detail,
            },
          );

          throw new Error(
            `Unable to get AI response (${response.status}): ${detail}`,
          );
        }

        if (!response.body) {
          throw new Error(
            "Nexora returned no response stream.",
          );
        }

        const reader =
          response.body.getReader();

        const decoder =
          new TextDecoder();

        let assistantText = "";

        while (true) {
          const {
            value,
            done,
          } = await reader.read();

          if (done) {
            break;
          }

          const chunk =
            decoder.decode(
              value,
              {
                stream: true,
              },
            );

          if (!chunk) {
            continue;
          }

          assistantText +=
            chunk;

          setMessages(
            (prev) => {
              const updated =
                [...prev];

              const lastIndex =
                updated.length -
                1;

              if (
                lastIndex >=
                  0 &&
                updated[
                  lastIndex
                ].role ===
                  "assistant"
              ) {
                updated[
                  lastIndex
                ] = {
                  ...updated[
                    lastIndex
                  ],

                  content:
                    assistantText,
                };
              }

              return updated;
            },
          );
        }

        const finalChunk =
          decoder.decode();

        if (finalChunk) {
          assistantText +=
            finalChunk;

          setMessages(
            (prev) => {
              const updated =
                [...prev];

              const lastIndex =
                updated.length -
                1;

              if (
                lastIndex >=
                  0 &&
                updated[
                  lastIndex
                ].role ===
                  "assistant"
              ) {
                updated[
                  lastIndex
                ] = {
                  ...updated[
                    lastIndex
                  ],

                  content:
                    assistantText,
                };
              }

              return updated;
            },
          );
        }

        if (
          assistantText.trim()
        ) {
          await saveMessage(
            activeConversationId,
            "assistant",
            assistantText,
          );
        }

        await loadConversations();
      } catch (err: any) {
        if (
          err?.name !==
          "AbortError"
        ) {
          console.error(
            "Send edited message error:",
            err,
          );

          setError(
            err?.message ||
              "Something went wrong.",
          );
        }
      } finally {
        setLoading(false);

        abortControllerRef.current =
          null;
      }
    };

  /* =========================================================
     SUBMIT EDIT
  ========================================================= */

  const submitEdit =
    async (
      index: number,
    ) => {
      const trimmed =
        editingText.trim();

      if (
        !trimmed ||
        loading
      ) {
        return;
      }

      const oldMessage =
        messages[index];

      setMessages(
        (prev) =>
          prev.map(
            (
              message,
              i,
            ) =>
              i === index
                ? {
                    ...message,
                    content:
                      trimmed,
                  }
                : message,
          ),
      );

      setEditingMessageId(
        null,
      );

      setEditingText("");

      setMessages(
        (prev) =>
          prev.slice(
            0,
            index + 1,
          ),
      );

      setInput("");

      await sendMessageWithText(
        trimmed,
      );

      console.log(
        "Edited message:",
        oldMessage,
      );
    };

  /* =========================================================
     KEYBOARD
  ========================================================= */

  const handleKeyDown =
    (
      e: KeyboardEvent<HTMLTextAreaElement>,
    ) => {
      if (
        e.key === "Enter" &&
        !e.shiftKey
      ) {
        e.preventDefault();

        void sendMessage();
      }
    };

  /* =========================================================
     FILTER
  ========================================================= */

  const filteredConversations =
    conversations.filter(
      (conversation) =>
        conversation.title
          ?.toLowerCase()
          .includes(
            search.toLowerCase(),
          ),
    );

  /* =========================================================
     SESSION LOADING
  ========================================================= */

  if (!sessionReady) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-[#101411]">
        <BrandMark className="h-12 w-12 animate-pulse" />
      </div>
    );
  }

  /* =========================================================
     UI
  ========================================================= */

  return (
    <main className="flex h-[100dvh] overflow-hidden bg-[#101411] text-[#edf3ee]">
      {showSplash && (
        <SplashScreen
          onComplete={() =>
            setShowSplash(false)
          }
        />
      )}

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[286px] -translate-x-full flex-col border-r border-[#263129] bg-[#151a16] p-3 transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen
            ? "translate-x-0 shadow-2xl"
            : ""
        }`}
      >
        <div className="flex items-center justify-between px-2 py-3">
          <div className="flex items-center gap-2.5">
            <BrandMark className="h-8 w-8" />

            <span className="text-[17px] font-semibold tracking-tight">
              Nexora
            </span>
          </div>

          <button
            onClick={() =>
              setSidebarOpen(false)
            }
            className="rounded-lg p-2 lg:hidden"
            title="Close sidebar"
          >
            <Icon
              name="close"
              className="h-4 w-4"
            />
          </button>
        </div>

        <div className="mb-3 rounded-2xl border border-[#2a362e] bg-[#1a211c] p-3">
          <button
            type="button"
            onClick={() =>
              router.push(
                "/settings",
              )
            }
            className="flex w-full items-center gap-3 rounded-xl border border-[#2c382f] bg-[#121713] p-2 text-left transition hover:border-[#5ec782] hover:bg-[#17211b]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#334439] bg-[#18221d] text-sm font-semibold text-[#8de0a5]">
              {(
                currentUser?.name ||
                "N"
              )
                .charAt(0)
                .toUpperCase()}
            </div>

            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-[#edf3ee]">
                {currentUser?.name ||
                  "Nexora User"}
              </div>

              <div className="truncate text-[11px] text-[#8f9b93]">
                {currentUser?.email ||
                  "Account"}
              </div>
            </div>
          </button>
        </div>

        <div className="pt-3">
          <button
            onClick={
              handleNewChat
            }
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1a211c] px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-[#2d382f]"
          >
            <Icon
              name="plus"
              className="h-4 w-4"
            />

            New Chat
          </button>
        </div>

        <div className="relative px-1 pb-3 pt-4">
          <Icon
            name="search"
            className="pointer-events-none absolute left-4 top-[28px] h-4 w-4 text-[#8c958e]"
          />

          <input
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value,
              )
            }
            aria-label="Search conversations"
            placeholder="Search chats..."
            className="w-full rounded-xl border border-[#2c382f] bg-[#1b221d] py-2.5 pl-9 pr-3 text-sm text-[#e8eee9] outline-none placeholder:text-[#7f8a82] focus:border-[#66ca88]"
          />
        </div>

        <div className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8b938d]">
          Your conversations
        </div>

        <div className="flex-1 overflow-y-auto px-1">
          {loadingHistory ? (
            <p className="p-3 text-sm text-gray-500">
              Loading chats...
            </p>
          ) : filteredConversations.length ===
            0 ? (
            <p className="p-3 text-sm text-gray-500">
              No conversations
              yet.
            </p>
          ) : (
            filteredConversations.map(
              (
                conversation,
              ) => (
                <div
                  key={
                    conversation.id
                  }
                  className={`group mb-1 flex items-center rounded-xl transition ${
                    conversationId ===
                    conversation.id
                      ? "bg-[#e3f6e9]"
                      : "hover:bg-[#eff2ef]"
                  }`}
                >
                  <button
                    onClick={() =>
                      openConversation(
                        conversation.id,
                      )
                    }
                    className="min-w-0 flex-1 px-3 py-2.5 text-left"
                  >
                    <div className="truncate text-sm font-medium">
                      {conversation.title ||
                        "New Chat"}
                    </div>

                    <div className="mt-0.5 text-[11px] capitalize text-[#778078]">
                      {conversation.mode ||
                        "general"}
                    </div>
                  </button>

                  <button
                    onClick={() =>
                      renameConversation(
                        conversation,
                      )
                    }
                    className="hidden px-1 text-sm text-gray-500 group-hover:block"
                    title="Rename"
                  >
                    <Icon
                      name="edit"
                      className="h-3.5 w-3.5"
                    />
                  </button>

                  <button
                    onClick={() =>
                      deleteConversation(
                        conversation.id,
                      )
                    }
                    className="hidden px-3 text-sm text-red-500 group-hover:block"
                    title="Delete"
                  >
                    <Icon
                      name="trash"
                      className="h-3.5 w-3.5"
                    />
                  </button>
                </div>
              ),
            )
          )}
        </div>
      </aside>

      {sidebarOpen && (
        <button
          aria-label="Close conversation sidebar"
          onClick={() =>
            setSidebarOpen(false)
          }
          className="fixed inset-0 z-30 bg-black/20 lg:hidden"
        />
      )}

      {/* =====================================================
          MAIN CHAT
      ===================================================== */}

      <section className="flex min-w-0 flex-1 flex-col">
        {/* HEADER */}

        <header className="flex h-[68px] items-center justify-between border-b border-[#263129] bg-[#121713]/95 px-4 backdrop-blur md:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                setSidebarOpen(true)
              }
              className="rounded-lg p-2 text-[#526058] hover:bg-[#eef1ee] lg:hidden"
              title="Open sidebar"
            >
              <Icon
                name="menu"
                className="h-5 w-5"
              />
            </button>

            <div className="flex items-center gap-2">
              <BrandMark className="h-7 w-7 lg:hidden" />

              <div>
                <h1 className="text-sm font-semibold tracking-tight">
                  Nexora{" "}
                  <span className="hidden text-[#89908b] sm:inline">
                    / AI Workspace
                  </span>
                </h1>

                <p className="hidden text-[11px] text-[#7b837d] sm:block">
                  Thoughtful intelligence,
                  ready when you are
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-1.5 rounded-full border border-[#2d3b32] bg-[#151d19] px-2.5 py-1 text-xs text-[#90a79a] sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-[#55c879]" />
              AI ready
            </div>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/settings",
                )
              }
              className="hidden items-center gap-2 rounded-xl border border-[#2c382f] bg-[#1b221d] px-3 py-2 text-sm text-[#e5efe7] transition hover:border-[#5ec782] hover:bg-[#1f2d24] sm:flex"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[#334439] bg-[#18221d] text-[11px] font-semibold text-[#8de0a5]">
                {(
                  authUser?.name ||
                  currentUser?.name ||
                  "N"
                )
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <span>
                {authUser?.name ||
                  currentUser?.name ||
                  "Account"}
              </span>
            </button>

            <button
              type="button"
              onClick={
                handleLogout
              }
              className="rounded-xl border border-[#4d3633] bg-[#2d2121] px-3 py-2 text-sm font-medium text-[#f8c3bf] transition hover:bg-[#3b2a2a]"
            >
              Log out
            </button>

            <select
              value={mode}
              onChange={(
                event,
              ) => {
                const nextMode =
                  event.target
                    .value as ChatMode;

                void handleModeChange(
                  nextMode,
                );
              }}
              aria-label="Conversation mode"
              className="rounded-xl border border-[#2c382f] bg-[#1b221d] px-3 py-2 text-sm font-medium text-[#dfe8e1] outline-none focus:border-[#66ca88]"
            >
              {Object.entries(
                MODE_CONFIG,
              ).map(
                ([
                  value,
                  config,
                ]) => (
                  <option
                    key={value}
                    value={value}
                  >
                    {
                      config.label
                    }
                  </option>
                ),
              )}
            </select>
          </div>
        </header>

        {/* ERROR */}

        {error && (
          <div
            role="alert"
            className="mx-4 mt-4 rounded-xl border border-[#f1c5bf] bg-[#fff3f1] px-4 py-3 text-sm text-[#9d3329] md:mx-6"
          >
            <div className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#e76b60] text-xs font-bold text-white">
                !
              </span>

              <div className="min-w-0 break-words">
                {error}
              </div>

              <button
                type="button"
                onClick={() =>
                  setError("")
                }
                className="ml-auto shrink-0 text-[#9d3329]"
                title="Dismiss"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* MESSAGES */}

        <div className="flex-1 overflow-y-auto">
          {messages.length ===
          0 ? (
            <div className="flex h-full items-center justify-center px-5 pb-16">
              <div className="max-w-2xl text-center">
                <div className="mx-auto mb-5 w-fit rounded-2xl border border-[#dfe6e0] bg-white p-3 shadow-sm">
                  <BrandMark className="h-12 w-12" />
                </div>

                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#4c9f68]">
                  Nexora intelligence
                </p>

                <h2 className="text-3xl font-semibold tracking-tight text-[#1b221d] sm:text-4xl">
                  {
                    MODE_CONFIG[
                      mode
                    ]
                      .welcomeTitle
                  }
                </h2>

                <p className="mt-3 text-sm leading-6 text-[#727a74]">
                  {
                    MODE_CONFIG[
                      mode
                    ]
                      .welcomeDescription
                  }
                </p>

                <div className="mt-8 grid grid-cols-1 gap-2 text-left sm:grid-cols-2">
                  {MODE_CONFIG[
                    mode
                  ].suggestions.map(
                    (
                      suggestion,
                    ) => (
                      <button
                        key={
                          suggestion
                        }
                        type="button"
                        onClick={() =>
                          setInput(
                            suggestion,
                          )
                        }
                        className="group rounded-xl border border-[#e1e6e1] bg-white p-4 text-sm font-medium text-[#343d36] shadow-sm transition hover:-translate-y-0.5 hover:border-[#9bdcaf] hover:shadow-md"
                      >
                        {
                          suggestion
                        }

                        <span className="float-right text-[#63bd7e]">
                          ↗
                        </span>
                      </button>
                    ),
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-4xl px-4 py-7 sm:px-8">
              {messages.map(
                (
                  message,
                  index,
                ) => (
                  <div
                    key={
                      message.id ||
                      `${index}-${message.role}`
                    }
                    className={`message-in mb-8 flex ${
                      message.role ===
                      "user"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] ${
                        message.role ===
                        "user"
                          ? "rounded-2xl rounded-br-md bg-[#1b221d] px-4 py-3 text-white shadow-sm"
                          : "w-full"
                      }`}
                    >
                      {editingMessageId ===
                      (message.id ||
                        message.content) ? (
                        <div>
                          <textarea
                            value={
                              editingText
                            }
                            onChange={(
                              e,
                            ) =>
                              setEditingText(
                                e.target
                                  .value,
                              )
                            }
                            className="min-h-[100px] w-full rounded-lg border border-gray-300 p-3 text-black outline-none"
                          />

                          <div className="mt-2 flex gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                void submitEdit(
                                  index,
                                )
                              }
                              className="rounded-lg bg-black px-3 py-2 text-sm text-white"
                            >
                              Send
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setEditingMessageId(
                                  null,
                                );

                                setEditingText(
                                  "",
                                );
                              }}
                              className="rounded-lg border px-3 py-2 text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : message.role ===
                        "assistant" ? (
                        <div>
                          <div className="flex gap-3 sm:gap-4">
                            <BrandMark className="mt-0.5 h-8 w-8 shrink-0" />

                            <div className="min-w-0 flex-1">
                              <div className="mb-2 text-sm font-semibold text-[#252d27]">
                                Nexora
                              </div>

                              <div className="markdown">
                                <ReactMarkdown
                                  rehypePlugins={[
                                    rehypeHighlight,
                                    rehypeKatex,
                                  ]}
                                  remarkPlugins={[
                                    remarkGfm,
                                    remarkMath,
                                  ]}
                                  components={{
                                    pre({
                                      children,
                                    }) {
                                      return (
                                        <CodeBlock>
                                          {
                                            children
                                          }
                                        </CodeBlock>
                                      );
                                    },

                                    code({
                                      children,
                                      className,
                                    }) {
                                      return (
                                        <code
                                          className={
                                            className
                                          }
                                        >
                                          {
                                            children
                                          }
                                        </code>
                                      );
                                    },

                                    table({
                                      children,
                                    }) {
                                      return (
                                        <MarkdownTable>
                                          {
                                            children
                                          }
                                        </MarkdownTable>
                                      );
                                    },

                                    thead({
                                      children,
                                    }) {
                                      return (
                                        <MarkdownTableHead>
                                          {
                                            children
                                          }
                                        </MarkdownTableHead>
                                      );
                                    },

                                    tbody({
                                      children,
                                    }) {
                                      return (
                                        <MarkdownTableBody>
                                          {
                                            children
                                          }
                                        </MarkdownTableBody>
                                      );
                                    },

                                    tr({
                                      children,
                                    }) {
                                      return (
                                        <MarkdownTableRow>
                                          {
                                            children
                                          }
                                        </MarkdownTableRow>
                                      );
                                    },

                                    th({
                                      children,
                                    }) {
                                      return (
                                        <MarkdownTableHeaderCell>
                                          {
                                            children
                                          }
                                        </MarkdownTableHeaderCell>
                                      );
                                    },

                                    td({
                                      children,
                                    }) {
                                      return (
                                        <MarkdownTableCell>
                                          {
                                            children
                                          }
                                        </MarkdownTableCell>
                                      );
                                    },
                                  }}
                                >
                                  {
                                    message.content
                                  }
                                </ReactMarkdown>
                              </div>

                              {!message.content &&
                                loading &&
                                index ===
                                  messages.length -
                                    1 && (
                                  <div className="flex items-center gap-2 py-2 text-sm text-[#718076]">
                                    <span className="thinking-dots">
                                      <i />
                                      <i />
                                      <i />
                                    </span>

                                    Thinking
                                  </div>
                                )}
                            </div>
                          </div>

                          {message.content && (
                            <div className="mt-3 flex gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  void copyResponse(
                                    message.content,
                                  )
                                }
                                title="Copy response"
                                className="action-button"
                              >
                                Copy
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  void regenerateResponse(
                                    index,
                                  )
                                }
                                disabled={
                                  loading
                                }
                                title="Regenerate response"
                                className="action-button disabled:opacity-50"
                              >
                                Regenerate
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <p className="whitespace-pre-wrap">
                            {
                              message.content
                            }
                          </p>

                          <button
                            type="button"
                            onClick={() =>
                              startEditing(
                                message,
                              )
                            }
                            title="Edit message"
                            className="mt-2 rounded-md px-2 py-1 text-xs text-[#7d857f] transition hover:bg-[#edf0ed] hover:text-[#303a32]"
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ),
              )}

              <div
                ref={
                  messagesEndRef
                }
              />
            </div>
          )}
        </div>

        {/* INPUT */}

        <div className="bg-gradient-to-t from-[#101411] via-[#101411] to-transparent px-3 pb-3 pt-5 sm:px-6">
          <form
            onSubmit={sendMessage}
            className="mx-auto flex max-w-4xl items-end gap-2 rounded-2xl border border-[#2d3930] bg-[#181e1a] p-2 shadow-[0_8px_30px_rgba(0,0,0,0.24)] transition focus-within:border-[#78cf96]"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.docx,.csv,.xlsx,.xls,.png,.jpg,.jpeg,.webp"
              className="hidden"
              onChange={
                handleFileUpload
              }
            />

            <button
              type="button"
              title="Attach file"
              onClick={() =>
                fileInputRef.current?.click()
              }
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#2d3930] bg-[#121713] text-[#dfece2] transition hover:border-[#5ec782] hover:bg-[#18221d]"
            >
              <span
                aria-hidden="true"
                className="text-lg"
              >
                📎
              </span>
            </button>

            {attachment && (
              <div className="flex items-center gap-2 rounded-xl border border-[#2d3930] bg-[#101411] px-2 py-1.5 text-[11px] text-[#e9f8ee]">
                <span className="rounded bg-[#163226] px-1.5 py-0.5 font-semibold text-[#8fe0a5]">
                  {getFileIcon(
                    attachment.mimeType,
                  )}
                </span>

                <div className="min-w-0">
                  <div className="max-w-[120px] truncate">
                    {
                      attachment.name
                    }
                  </div>

                  <div className="text-[#8a938c]">
                    {formatFileSize(
                      attachment.size,
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  title="Remove attachment"
                  onClick={() =>
                    setAttachment(
                      null,
                    )
                  }
                  className="text-[#f1c4bf] hover:text-[#f6d7d3]"
                >
                  ×
                </button>
              </div>
            )}

            <textarea
              value={
                isListening
                  ? voiceMessage ||
                    "Listening…"
                  : input
              }
              onChange={(e) => {
                if (!isListening) {
                  setInput(
                    e.target.value,
                  );
                }
              }}
              onKeyDown={
                handleKeyDown
              }
              disabled={loading}
              aria-label="Message Nexora"
              placeholder={
                isListening
                  ? "Listening…"
                  : "Message Nexora…"
              }
              rows={1}
              className="max-h-40 min-h-[48px] flex-1 resize-none bg-transparent px-3 py-3 text-[15px] leading-6 outline-none placeholder:text-[#9aa29c] disabled:cursor-not-allowed"
            />

            <button
              type="button"
              onClick={
                toggleVoiceInput
              }
              title={
                isListening
                  ? "Stop microphone"
                  : "Use voice input"
              }
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-sm transition ${
                isListening
                  ? "border-[#f7b4a7] bg-[#3a1f1d] text-[#ffd7d0] animate-pulse"
                  : "border-[#2d3930] bg-[#121713] text-[#dfece2] hover:border-[#5ec782] hover:bg-[#18221d]"
              }`}
            >
              🎙️
            </button>

            {loading ? (
              <button
                type="button"
                onClick={
                  stopGenerating
                }
                title="Stop generating"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#fbe9e7] text-[#bd473c] transition hover:bg-[#f6d3ce]"
              >
                <Icon
                  name="stop"
                  className="h-4 w-4"
                />
              </button>
            ) : (
              <button
                type="submit"
                disabled={
                  !input.trim() &&
                  !attachment
                }
                title="Send message"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#1a211c] text-white shadow-sm transition hover:bg-[#2c372f] disabled:cursor-not-allowed disabled:opacity-35"
              >
                <Icon
                  name="send"
                  className="h-4 w-4"
                />
              </button>
            )}
          </form>

          <p className="mt-2 text-center text-xs text-gray-400">
            Enter to send • Shift +
            Enter for new line
          </p>
        </div>
      </section>
    </main>
  );
}