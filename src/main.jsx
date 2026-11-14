import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { io } from "socket.io-client";
import {
  FiSearch,
  FiMapPin,
  FiHeart,
  FiUser,
  FiPlus,
  FiChevronDown,
  FiArrowRight,
  FiX,
  FiMenu,
  FiSliders,
  FiCheck,
  FiMessageCircle,
  FiShield,
  FiFeather,
  FiLogOut,
  FiPackage,
  FiBell,
} from "react-icons/fi";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

import "./styles.css";

const demoItems = [
  {
    id: "demo-1",
    title: "Mid-century oak sideboard",
    category: "Storage",
    price: 480,
    old: 820,
    place: "Indiranagar, Bengaluru",
    time: "2 hours ago",
    createdAtValue: 8,
    condition: "Very good",
    seller: "Ananya R.",
    image: "photo-1555041469-a586c61ea9bc",
    tag: "JUST LISTED",
  },
  {
    id: "demo-2",
    title: "Linen two-seater sofa",
    category: "Sofas",
    price: 650,
    old: 1290,
    place: "Koramangala, Bengaluru",
    time: "5 hours ago",
    createdAtValue: 7,
    condition: "Like new",
    seller: "Rahul M.",
    image: "photo-1550254478-ead40cc54513",
    tag: "GREAT FIND",
  },
  {
    id: "demo-3",
    title: "Solid teak dining table",
    category: "Tables",
    price: 390,
    old: 700,
    place: "Jubilee Hills, Hyderabad",
    time: "Yesterday",
    createdAtValue: 6,
    condition: "Good",
    seller: "Mira S.",
    image:
      "https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=900&q=85",
    tag: "PRICE DROP",
  },
  {
    id: "demo-4",
    title: "Woven rattan lounge chair",
    category: "Chairs",
    price: 220,
    old: 360,
    place: "Bandra West, Mumbai",
    time: "Yesterday",
    createdAtValue: 5,
    condition: "Very good",
    seller: "Dev P.",
    image: "photo-1567538096630-e0c55bd6374c",
    tag: "",
  },
  {
    id: "demo-5",
    title: "Scandinavian bedside pair",
    category: "Bedroom",
    price: 180,
    old: 320,
    place: "Whitefield, Bengaluru",
    time: "2 days ago",
    createdAtValue: 4,
    condition: "Good",
    seller: "Isha K.",
    image: "photo-1505693416388-ac5ce068fe85",
    tag: "",
  },
  {
    id: "demo-6",
    title: "Vintage walnut writing desk",
    category: "Tables",
    price: 340,
    old: 590,
    place: "Powai, Mumbai",
    time: "2 days ago",
    createdAtValue: 3,
    condition: "Very good",
    seller: "Karan D.",
    image: "photo-1499933374294-4584851497cc",
    tag: "VINTAGE",
  },
  {
    id: "demo-7",
    title: "Curved boucle accent chair",
    category: "Chairs",
    price: 260,
    old: 450,
    place: "Hauz Khas, Delhi",
    time: "3 days ago",
    createdAtValue: 2,
    condition: "Like new",
    seller: "Naina B.",
    image: "photo-1598300056393-4aac492f4344",
    tag: "",
  },
  {
    id: "demo-8",
    title: "Handcrafted cane bookshelf",
    category: "Storage",
    price: 310,
    old: 540,
    place: "Kalyani Nagar, Pune",
    time: "3 days ago",
    createdAtValue: 1,
    condition: "Good",
    seller: "Aarav T.",
    image: "photo-1594620302200-9a762244a156",
    tag: "",
  },
];
const defaultCategories = [
  ["All furniture", "✳"],
  ["Sofas", "▱"],
  ["Chairs", "♧"],
  ["Tables", "⌑"],
  ["Bedroom", "▰"],
  ["Storage", "▤"],
  ["Lighting", "☼"],
  ["Outdoor", "♧"],
];
const api = async (path, options = {}) => {
  const isForm =
    typeof FormData !== "undefined" && options.body instanceof FormData;
  const response = await fetch(`/api${path}`, {
    credentials: "include",
    ...options,
    headers: {
      ...(options.body && !isForm
        ? { "Content-Type": "application/json" }
        : {}),
      ...options.headers,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(
      data.message || "Something went wrong. Please try again.",
    );
    error.code = data.code;
    throw error;
  }
  return data;
};
const imageUrl = (value) =>
  !value
    ? ""
    : value.startsWith("http") || value.startsWith("/")
      ? value
      : `https://images.unsplash.com/${value}?auto=format&fit=crop&w=900&q=85`;
const fromListing = (listing) => ({
  id: listing._id,
  title: listing.title,
  category: listing.category,
  price: listing.price,
  originalPrice: listing.originalPrice,
  old: listing.originalPrice || Math.round(listing.price * 1.5),
  place: [listing.location?.area, listing.location?.city]
    .filter(Boolean)
    .join(", "),
  city: listing.location?.city || "",
  area: listing.location?.area || "",
  time: new Date(listing.createdAt).toLocaleDateString(),
  condition: listing.condition,
  seller: listing.seller?.name || "FurniLoop member",
  image: listing.images?.[0] || "photo-1555041469-a586c61ea9bc",
  images: listing.images || [],
  description: listing.description,
  status: listing.status,
  material: listing.material,
  dimensions: listing.dimensions,
  views: listing.views || 0,
  purchaseYear: listing.purchaseYear,
  sellerId: listing.seller?._id,
  createdAtValue: new Date(listing.createdAt).getTime() || 0,
});

function App() {
  const [items, setItems] = useState(demoItems);
  const [categories, setCategories] = useState(defaultCategories);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All furniture");
  const [sort, setSort] = useState("Recommended");
  const [location, setLocation] = useState(
    () => localStorage.getItem("furniloop_location") || "",
  );
  const [saved, setSaved] = useState([]);
  const [user, setUser] = useState(null);
  const [modal, setModal] = useState("");
  const [authMode, setAuthMode] = useState("login");
  const [resetToken, setResetToken] = useState("");
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [menu, setMenu] = useState(false);
  const [adminSection, setAdminSection] = useState("Overview");
  const [toast, setToast] = useState("");
  const [apiReady, setApiReady] = useState(false);
  const [demoMode, setDemoMode] = useState(true);
  const [loading, setLoading] = useState(true);
  const [myListings, setMyListings] = useState([]);
  const [savedItems, setSavedItems] = useState([]);
  const [receivedOffers, setReceivedOffers] = useState([]);
  const [sentOffers, setSentOffers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [activeListing, setActiveListing] = useState(null);
  const [messages, setMessages] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [receivedReviews, setReceivedReviews] = useState([]);
  const [givenReviews, setGivenReviews] = useState([]);
  const [sellerProfile, setSellerProfile] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const socketRef = useRef(null);
  const [adminData, setAdminData] = useState({
    summary: {},
    listings: [],
    users: [],
    reports: [],
    categories: [],
    reviews: [],
  });
  const [formError, setFormError] = useState("");
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [photoUrl, setPhotoUrl] = useState("");

  const visible = useMemo(
    () =>
      items
        .filter((item) => {
          const matchesLocation =
            !location ||
            [item.city, item.area, ...String(item.place || "").split(",")].some(
              (part) =>
                String(part || "")
                  .trim()
                  .toLowerCase() === location.trim().toLowerCase(),
            );
          return (
            matchesLocation &&
            (category === "All furniture" || item.category === category) &&
            `${item.title} ${item.category} ${item.place}`
              .toLowerCase()
              .includes(query.toLowerCase())
          );
        })
        .sort((a, b) =>
          sort === "Price: low to high"
            ? a.price - b.price
            : sort === "Newest first"
              ? b.createdAtValue - a.createdAtValue
              : 0,
        ),
    [items, category, query, sort, location],
  );
  const notice = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
  };

  const loadListings = async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.q) params.set("q", filters.q);
    if (filters.category && filters.category !== "All furniture")
      params.set("category", filters.category);
    if (filters.city) params.set("city", filters.city.trim());
    if (filters.sort)
      params.set(
        "sort",
        filters.sort === "Price: low to high"
          ? "price_asc"
          : filters.sort === "Recommended"
            ? "newest"
            : "newest",
      );
    const result = await api(`/listings?${params.toString()}`);
    return result.listings.map(fromListing);
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [listingResult, session, categoryResult] = await Promise.all([
          api(
            `/listings${location ? `?city=${encodeURIComponent(location)}` : ""}`,
          ),
          api("/auth/me").catch(() => null),
          api("/categories").catch(() => null),
        ]);
        if (!alive) return;
        if (categoryResult?.categories)
          setCategories([
            ["All furniture", "✳"],
            ...categoryResult.categories.map((item) => [item.name, item.icon]),
          ]);
        setApiReady(true);
        setDemoMode(false);
        setItems(listingResult.listings.map(fromListing));
        if (session?.user) {
          setUser(session.user);
          if (session.user.role === "admin") {
            await openAdmin();
          }
          const [favorites, notificationResult] = await Promise.all([
            api("/auth/favorites").catch(() => ({ listings: [] })),
            api("/notifications").catch(() => ({
              notifications: [],
              unread: 0,
            })),
          ]);
          if (alive) {
            setSaved(favorites.listings.map((listing) => listing._id));
            setNotifications(notificationResult.notifications);
            setUnreadNotifications(notificationResult.unread);
          }
        }
      } catch {
        if (alive) {
          setDemoMode(true);
          setItems(demoItems);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!user) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      return undefined;
    }
    const socket = io({ withCredentials: true });
    socketRef.current = socket;
    socket.on("connect", () => {
      if (activeConversation?._id)
        socket.emit("conversation:join", activeConversation._id);
    });
    socket.on("notification:new", (notification) => {
      setNotifications((current) =>
        [
          notification,
          ...current.filter((item) => item._id !== notification._id),
        ].slice(0, 60),
      );
      setUnreadNotifications((current) => current + 1);
    });
    socket.on("message:new", (message) => {
      if (
        activeConversation &&
        message.conversation === activeConversation._id
      ) {
        setMessages((current) =>
          current.some((item) => item._id === message._id)
            ? current
            : [...current, message],
        );
      }
    });
    if (socket.connected && activeConversation?._id)
      socket.emit("conversation:join", activeConversation._id);
    return () => {
      socket.disconnect();
      if (socketRef.current === socket) socketRef.current = null;
    };
  }, [user, activeConversation]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const verifyToken = params.get("verify");
    const passwordToken = params.get("reset");
    if (verifyToken) {
      api("/auth/verify", {
        method: "POST",
        body: JSON.stringify({ token: verifyToken }),
      })
        .then((result) => notice(result.message))
        .catch((error) => notice(error.message));
      params.delete("verify");
      const suffix = params.toString() ? `?${params}` : "";
      window.history.replaceState(
        {},
        "",
        `${window.location.pathname}${suffix}${window.location.hash}`,
      );
    }
    if (passwordToken) {
      setResetToken(passwordToken);
      setAuthMode("reset");
      setModal("auth");
      params.delete("reset");
      const suffix = params.toString() ? `?${params}` : "";
      window.history.replaceState(
        {},
        "",
        `${window.location.pathname}${suffix}${window.location.hash}`,
      );
    }
  }, []);

  useEffect(() => {
    if (!apiReady) return undefined;
    const timer = window.setTimeout(async () => {
      try {
        setItems(
          await loadListings({ q: query, category, sort, city: location }),
        );
      } catch (error) {
        notice(error.message);
      }
    }, 240);
    return () => window.clearTimeout(timer);
  }, [query, category, sort, location, apiReady]);

  const applyLocation = async (event) => {
    event.preventDefault();
    const selected = String(
      new FormData(event.currentTarget).get("location") || "",
    )
      .trim()
      .replace(/\s+/g, " ");
    setLocation(selected);
    if (selected) localStorage.setItem("furniloop_location", selected);
    else localStorage.removeItem("furniloop_location");
    if (apiReady) {
      try {
        setItems(
          await loadListings({ q: query, category, sort, city: selected }),
        );
      } catch (error) {
        notice(error.message);
      }
    } else {
      setItems(
        selected
          ? demoItems.filter((item) =>
              String(item.place)
                .split(",")
                .some(
                  (part) =>
                    part.trim().toLowerCase() === selected.toLowerCase(),
                ),
            )
          : demoItems,
      );
    }
    notice(
      selected
        ? `Showing furniture in ${selected}`
        : "Showing furniture in all locations",
    );
  };

  const showAuth = (mode = "login") => {
    setAuthMode(mode);
    setFormError("");
    setModal("auth");
  };
  const startSell = (listing = null) => {
    setFormError("");
    setEditing(listing);
    setUploadedImages(listing?.images || []);
    setPhotoUrl("");

    if (apiReady && !user) {
      showAuth("register");
      notice("Create an account before listing furniture.");
      return;
    }

    setModal("sell");
  };

  const toggleFavorite = async (item) => {
    if (item.id.startsWith("demo-")) {
      setSaved((current) =>
        current.includes(item.id)
          ? current.filter((id) => id !== item.id)
          : [...current, item.id],
      );
      notice("Demo favourite saved in this session");
      return;
    }
    if (!user) {
      showAuth("login");
      return;
    }
    try {
      const result = await api(`/listings/${item.id}/favorite`, {
        method: "POST",
      });
      setSaved((current) =>
        result.saved
          ? [...current, item.id]
          : current.filter((id) => id !== item.id),
      );
      notice(result.saved ? "Saved to your favourites" : "Removed from saved");
    } catch (error) {
      notice(error.message);
    }
  };

  const handleAuth = async (event) => {
    event.preventDefault();
    setFormError("");
    const form = new FormData(event.currentTarget);
    if (
      authMode === "reset" &&
      form.get("password") !== form.get("confirmPassword")
    ) {
      setFormError("The passwords do not match.");
      return;
    }
    const body =
      authMode === "register"
        ? {
            name: form.get("name"),
            email: form.get("email"),
            password: form.get("password"),
          }
        : authMode === "forgot"
          ? { email: form.get("email") }
          : authMode === "reset"
            ? { token: resetToken, password: form.get("password") }
            : { email: form.get("email"), password: form.get("password") };
    try {
      const endpoint = {
        register: "/auth/register",
        forgot: "/auth/forgot-password",
        reset: "/auth/reset-password",
        login: "/auth/login",
        admin: "/auth/admin-login",
      }[authMode];
      const result = await api(endpoint, {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (authMode === "register") {
        setAuthMode("login");
        setFormError(result.message);
        notice("Check your email to verify the account");
        return;
      }
      if (authMode === "forgot") {
        setAuthMode("login");
        setFormError(result.message);
        notice("If the account exists, a reset link was sent");
        return;
      }
      if (authMode === "reset") {
        setAuthMode("login");
        setResetToken("");
        setFormError(result.message);
        notice("Password updated");
        return;
      }
      setUser(result.user);
      const [favorites, notificationResult] = await Promise.all([
        api("/auth/favorites").catch(() => ({ listings: [] })),
        api("/notifications").catch(() => ({ notifications: [], unread: 0 })),
      ]);
      setSaved(favorites.listings.map((listing) => listing._id));
      setNotifications(notificationResult.notifications);
      setUnreadNotifications(notificationResult.unread);
      setUnverifiedEmail("");
      setModal("");
      notice(
        `Welcome${authMode === "register" ? " to FurniLoop" : " back"}, ${result.user.name.split(" ")[0]}!`,
      );
      if (authMode === "admin" && result.user?.role === "admin") {
        setAdminSection("Overview");
        await openAdmin();
      }
    } catch (error) {
      if (error.code === "EMAIL_UNVERIFIED")
        setUnverifiedEmail(String(form.get("email") || ""));
      setFormError(error.message);
    }
  };

  const resendVerification = async () => {
    try {
      const result = await api("/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify({ email: unverifiedEmail }),
      });
      setFormError(result.message);
    } catch (error) {
      setFormError(error.message);
    }
  };

  const openNotifications = async () => {
    try {
      const result = await api("/notifications");
      setNotifications(result.notifications);
      setUnreadNotifications(result.unread);
      setModal("notifications");
    } catch (error) {
      notice(error.message);
    }
  };

  const activateNotification = async (notification) => {
    if (!notification.readAt) {
      await api(`/notifications/${notification._id}/read`, {
        method: "PATCH",
      }).catch(() => null);
      setNotifications((current) =>
        current.map((item) =>
          item._id === notification._id
            ? { ...item, readAt: new Date().toISOString() }
            : item,
        ),
      );
      setUnreadNotifications((current) => Math.max(0, current - 1));
    }
    if (notification.conversation) {
      const result = await api("/conversations").catch(() => ({
        conversations: [],
      }));
      const conversation = result.conversations.find(
        (item) => item._id === notification.conversation,
      );
      if (conversation) {
        await openConversation(null, conversation);
        return;
      }
    }
    if (notification.listing) {
      const item = items.find((listing) => listing.id === notification.listing);
      if (item) {
        setModal(`item:${item.id}`);
        return;
      }
    }
    await openDashboard();
  };

  const handleLogout = async () => {
    try {
      await api("/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
      setSaved([]);
      setModal("");
      notice("You are signed out");
    }
  };

  const handleListing = async (event) => {
    event.preventDefault();
    setFormError("");
    if (!apiReady) {
      setFormError(
        "Start the API and connect MongoDB before publishing a listing.",
      );
      return;
    }
    if (!user) {
      showAuth("register");
      notice("Create an account before posting your furniture.");
      return;
    }
    const values = new FormData(event.currentTarget);
    const images = uploadedImages;
    if (images.length === 0) {
      setFormError("Add at least one furniture photo before publishing.");
      return;
    }
    const body = {
      title: values.get("title"),
      description: values.get("description"),
      category: values.get("category"),
      price: Number(values.get("price")),
      originalPrice: values.get("originalPrice")
        ? Number(values.get("originalPrice"))
        : undefined,
      condition: values.get("condition"),
      material: values.get("material"),
      dimensions: values.get("dimensions"),
      purchaseYear: values.get("purchaseYear")
        ? Number(values.get("purchaseYear"))
        : undefined,
      images,
      area: String(values.get("area") || "").trim(),
      city: String(values.get("city") || "").trim(),
    };
    try {
      const result = editing
        ? await api(`/listings/${editing.id}`, {
            method: "PATCH",
            body: JSON.stringify(body),
          })
        : await api("/listings", {
            method: "POST",
            body: JSON.stringify(body),
          });
      const updated = fromListing(result.listing);
      setItems((current) =>
        editing
          ? current.map((item) => (item.id === updated.id ? updated : item))
          : [updated, ...current],
      );
      setMyListings((current) =>
        editing
          ? current.map((item) => (item.id === updated.id ? updated : item))
          : current,
      );
      setModal("");
      setUploadedImages([]);
      setEditing(null);
      notice(
        editing ? "Your listing was updated" : "Your furniture is listed!",
      );
    } catch (error) {
      setFormError(error.message);
    }
  };

  const handlePhotoUpload = async (event) => {
    const input = event.currentTarget;
    const files = [...input.files];
    if (!files.length) return;
    if (!user) {
      input.value = "";
      showAuth("register");
      notice("Create an account before uploading listing photos.");
      return;
    }
    if (uploadedImages.length + files.length > 8) {
      setFormError("You can add up to 8 photos.");
      input.value = "";
      return;
    }
    setFormError("");
    setUploading(true);
    const payload = new FormData();
    files.forEach((file) => payload.append("images", file));
    try {
      const result = await api("/uploads", { method: "POST", body: payload });
      setUploadedImages((current) => [...current, ...result.images]);
    } catch (error) {
      setFormError(error.message);
    } finally {
      setUploading(false);
      input.value = "";
    }
  };

  const addPhotoUrl = () => {
    const url = photoUrl.trim();

    if (!url.startsWith("https://") && !url.startsWith("http://")) {
      setFormError("Please enter a valid image URL.");
      return;
    }

    if (uploadedImages.length >= 8) {
      setFormError("You can add up to 8 photos.");
      return;
    }

    setUploadedImages((current) => [...current, url]);
    setPhotoUrl("");
    setFormError("");
  };

  const openDashboard = async () => {
    if (!user) {
      showAuth("login");
      return;
    }
    if (!apiReady) {
      notice("Connect the API to open your account dashboard");
      return;
    }
    try {
      const [result, favorites, incoming, outgoing, inbox, deals, reviews] =
        await Promise.all([
          api("/listings/mine"),
          api("/auth/favorites"),
          api("/offers?side=received"),
          api("/offers?side=sent"),
          api("/conversations"),
          api("/transactions"),
          api("/reviews/mine"),
        ]);
      setMyListings(result.listings.map(fromListing));
      setSavedItems(favorites.listings.map(fromListing));
      setReceivedOffers(incoming.offers);
      setSentOffers(outgoing.offers);
      setConversations(inbox.conversations);
      setTransactions(deals.transactions);
      setReceivedReviews(reviews.received);
      setGivenReviews(reviews.given);
      setModal("dashboard");
    } catch (error) {
      notice(error.message);
    }
  };

  const openSellerProfile = async (item) => {
    if (!item.sellerId) {
      notice("Seller profiles appear on live listings.");
      return;
    }
    try {
      setSellerProfile(await api(`/reviews/user/${item.sellerId}`));
      setModal("seller");
    } catch (error) {
      notice(error.message);
    }
  };

  const openAdmin = async () => {
    try {
      const [
        summary,
        listings,
        users,
        reports,
        categoryResult,
        reviewResult,
        analytics,
      ] = await Promise.all([
        api("/admin/summary"),
        api("/admin/listings"),
        api("/admin/users"),
        api("/admin/reports"),
        api("/categories/manage"),
        api("/admin/reviews"),
        api("/admin/analytics"),
      ]);
      setAdminData({
        summary,
        listings: listings.listings,
        users: users.users,
        reports: reports.reports,
        categories: categoryResult.categories,
        reviews: reviewResult.reviews,
        analytics,
      });
      setAdminSection("Overview");
    } catch (error) {
      notice(error.message);
    }
  };

  const updateAdminRecord = async (path, status, kind) => {
    try {
      const result = await api(path, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      if (kind === "listing")
        setAdminData((current) => ({
          ...current,
          listings: current.listings.map((item) =>
            item._id === result.listing._id ? result.listing : item,
          ),
        }));
      if (kind === "user")
        setAdminData((current) => ({
          ...current,
          users: current.users.map((item) =>
            item._id === result.user._id ? result.user : item,
          ),
        }));
      if (kind === "report")
        setAdminData((current) => ({
          ...current,
          reports: current.reports.map((item) =>
            item._id === result.report._id ? result.report : item,
          ),
        }));
      if (kind === "review")
        setAdminData((current) => ({
          ...current,
          reviews: current.reviews.map((item) =>
            item._id === result.review._id ? result.review : item,
          ),
        }));
      notice("Admin change saved");
    } catch (error) {
      notice(error.message);
    }
  };

  const saveCategory = async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      const result = await api("/categories", {
        method: "POST",
        body: JSON.stringify({
          name: form.get("name"),
          icon: form.get("icon"),
        }),
      });
      setAdminData((current) => ({
        ...current,
        categories: [...current.categories, result.category],
      }));
      setCategories((current) => [
        ...current,
        [result.category.name, result.category.icon],
      ]);
      formElement.reset();
      notice("Category added");
    } catch (error) {
      notice(error.message);
    }
  };

  const updateCategory = async (categoryRecord, changes) => {
    try {
      const result = await api(`/categories/${categoryRecord._id}`, {
        method: "PATCH",
        body: JSON.stringify(changes),
      });
      setAdminData((current) => ({
        ...current,
        categories: current.categories.map((item) =>
          item._id === result.category._id ? result.category : item,
        ),
      }));
      const activeCategories = await api("/categories");
      setCategories([
        ["All furniture", "✳"],
        ...activeCategories.categories.map((item) => [item.name, item.icon]),
      ]);
      notice("Category updated");
    } catch (error) {
      notice(error.message);
    }
  };

  const removeCategory = async (categoryRecord) => {
    try {
      await api(`/categories/${categoryRecord._id}`, { method: "DELETE" });
      setAdminData((current) => ({
        ...current,
        categories: current.categories.filter(
          (item) => item._id !== categoryRecord._id,
        ),
      }));
      const activeCategories = await api("/categories");
      setCategories([
        ["All furniture", "✳"],
        ...activeCategories.categories.map((item) => [item.name, item.icon]),
      ]);
      notice("Category deleted");
    } catch (error) {
      notice(error.message);
    }
  };

  const submitReport = async (event, item) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await api("/reports", {
        method: "POST",
        body: JSON.stringify({
          listingId: item.id,
          reason: form.get("reason"),
          details: form.get("details"),
        }),
      });
      setModal("");
      notice("Thank you. The listing was reported for review.");
    } catch (error) {
      setFormError(error.message);
    }
  };

  const updateListingStatus = async (item, status) => {
    try {
      const result = await api(`/listings/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      const updated = fromListing(result.listing);
      setMyListings((current) =>
        current.map((listing) => (listing.id === item.id ? updated : listing)),
      );
      setItems((current) =>
        status === "ACTIVE"
          ? [updated, ...current.filter((listing) => listing.id !== item.id)]
          : current.filter((listing) => listing.id !== item.id),
      );
      notice(
        status === "SOLD"
          ? "Marked as sold"
          : status === "INACTIVE"
            ? "Listing paused"
            : "Listing is live",
      );
    } catch (error) {
      notice(error.message);
    }
  };

  const openConversation = async (item, existing = null) => {
    if (!user) {
      showAuth("login");
      return;
    }
    if (item?.id?.startsWith("demo-")) {
      notice("Messaging works when live listings are connected.");
      return;
    }
    try {
      const conversation =
        existing ||
        (
          await api("/conversations", {
            method: "POST",
            body: JSON.stringify({ listingId: item.id }),
          })
        ).conversation;
      const response = await api(`/conversations/${conversation._id}/messages`);
      setActiveConversation(conversation);
      setActiveListing(
        item ||
          (conversation.listing ? fromListing(conversation.listing) : null),
      );
      setMessages(response.messages);
      setModal("chat");
    } catch (error) {
      notice(error.message);
    }
  };

  const sendMessage = async (event) => {
    event.preventDefault();
    if (!activeConversation) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const body = String(form.get("body") || "").trim();
    if (!body) return;
    try {
      const result = await api(
        `/conversations/${activeConversation._id}/messages`,
        { method: "POST", body: JSON.stringify({ body }) },
      );
      setMessages((current) => [...current, result.message]);
      formElement.reset();
    } catch (error) {
      notice(error.message);
    }
  };

  const sendOffer = async (event, item) => {
    event.preventDefault();
    if (!user) {
      showAuth("login");
      return;
    }
    const form = new FormData(event.currentTarget);
    try {
      await api("/offers", {
        method: "POST",
        body: JSON.stringify({
          listingId: item.id,
          amount: Number(form.get("amount")),
          message: form.get("message"),
        }),
      });
      notice("Your offer was sent");
      setModal("");
    } catch (error) {
      setFormError(error.message);
    }
  };

  const handleOfferDecision = async (offer, status, formElement) => {
    const form = new FormData(formElement);
    try {
      const result = await api(`/offers/${offer._id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status,
          counterPrice: Number(form.get("counterPrice")),
        }),
      });
      setReceivedOffers((current) =>
        current.map((item) => (item._id === offer._id ? result.offer : item)),
      );
      if (status === "ACCEPTED") {
        const [deals, updatedListings] = await Promise.all([
          api("/transactions"),
          api("/listings/mine"),
        ]);
        setTransactions(deals.transactions);
        setMyListings(updatedListings.listings.map(fromListing));
        setItems((current) =>
          current.filter((listing) => listing.id !== result.offer.listing?._id),
        );
      }
      notice(
        status === "ACCEPTED"
          ? "Offer accepted"
          : status === "REJECTED"
            ? "Offer declined"
            : "Counteroffer sent",
      );
    } catch (error) {
      notice(error.message);
    }
  };

  const updateTransaction = async (transaction, status) => {
    try {
      const result = await api(`/transactions/${transaction._id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setTransactions((current) =>
        current.map((item) =>
          item._id === transaction._id ? result.transaction : item,
        ),
      );
      setItems(
        await loadListings({ q: query, category, sort, city: location }),
      );
      if (status === "COMPLETED") {
        const reviews = await api("/reviews/mine");
        setReceivedReviews(reviews.received);
        setGivenReviews(reviews.given);
      }
      notice(
        status === "COMPLETED"
          ? "Sale marked complete. You can now leave feedback."
          : "Arrangement cancelled; the listing is live again.",
      );
    } catch (error) {
      notice(error.message);
    }
  };

  const sendReview = async (event, transaction) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await api("/reviews", {
        method: "POST",
        body: JSON.stringify({
          transactionId: transaction._id,
          rating: Number(form.get("rating")),
          comment: form.get("comment"),
        }),
      });
      const reviews = await api("/reviews/mine");
      setReceivedReviews(reviews.received);
      setGivenReviews(reviews.given);
      notice("Thanks for sharing your experience");
    } catch (error) {
      notice(error.message);
    }
  };

  const submitSort = (value) => setSort(value);

  if (user?.role === "admin") {
    return (
      <div className="admin-page">
        <div className="admin-dashboard">
          <aside className="admin-sidebar">
            <h2>FurniLoop</h2>
            <p>ADMIN PANEL</p>

            <nav>
              {[
                "Overview",
                "Analytics",
                "Listings",
                "Reports",
                "Users",
                "Reviews",
                "Categories",
              ].map((section) => (
                <button
                  key={section}
                  className={adminSection === section ? "active" : ""}
                  onClick={() => {
                    setAdminSection(section);

                    const sectionIds = {
                      Overview: "admin-overview",
                      Analytics: "admin-analytics",
                      Listings: "admin-listings",
                      Reports: "admin-reports",
                      Users: "admin-users",
                      Reviews: "admin-reviews",
                      Categories: "admin-categories",
                    };

                    document
                      .getElementById(sectionIds[section])
                      ?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                  }}
                >
                  {section}
                </button>
              ))}
            </nav>

            <button onClick={handleLogout}>Sign out</button>
          </aside>

          <main className="admin-main">
            <header className="admin-topbar">
              <div>
                <h2>Admin Dashboard</h2>
                <p>Manage your FurniLoop marketplace</p>
              </div>
            </header>

            <div className="admin-content">
              <div className="eyebrow dark">
                <span></span> MARKETPLACE ADMIN
              </div>
              <h2>FurniLoop overview</h2>
              <p className="modal-intro">
                Review listings and member reports, and manage account access.
              </p>
              <div className="admin-stats" id="admin-overview">
                {[
                  ["Members", adminData.summary.users],
                  ["Live listings", adminData.summary.activeListings],
                  ["Open reports", adminData.summary.openReports],
                  ["Pending offers", adminData.summary.pendingOffers],
                ].map(([label, value]) => (
                  <div key={label}>
                    <strong>{value ?? "—"}</strong>
                    <small>{label}</small>
                  </div>
                ))}
              </div>

              <div className="admin-analytics" id="admin-analytics">
                <h3>Business Analytics</h3>

                <div className="analytics-grid">
                  <div className="analytics-card">
                    <h3>Monthly Completed Transaction Value (₹)</h3>
                    <ResponsiveContainer width="100%" height={260}>
                      <AreaChart data={adminData.analytics?.monthly || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke="#16a085"
                          fill="#16a085"
                          fillOpacity={0.2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="analytics-card">
                    <h3>User Registration Growth</h3>
                    <ResponsiveContainer width="100%" height={260}>
                      <LineChart data={adminData.analytics?.monthly || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="registrations"
                          stroke="#3867d6"
                          strokeWidth={3}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="analytics-card">
                    <h3>Monthly Orders & Sales</h3>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={adminData.analytics?.monthly || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="orders" name="Orders" fill="#3867d6" />
                        <Bar
                          dataKey="sales"
                          name="Completed Sales"
                          fill="#16a085"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="analytics-card">
                    <h3>Revenue by Furniture Category</h3>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart
                        data={adminData.analytics?.categoryRevenue || []}
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="_id" width={90} />
                        <Tooltip />
                        <Bar dataKey="revenue" fill="#e67e22" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="analytics-card">
                  <h3>Top 5 Best-Selling Products</h3>
                  {(adminData.analytics?.bestSelling || []).map((product) => (
                    <div className="analytics-product-row" key={product._id}>
                      <div>
                        <strong>{product.title}</strong>
                        <small>
                          {product.category} · {product.sales} sales
                        </small>
                      </div>
                      <strong>
                        ₹{Number(product.revenue || 0).toLocaleString("en-IN")}
                      </strong>
                    </div>
                  ))}

                  {(!adminData.analytics?.bestSelling ||
                    adminData.analytics.bestSelling.length === 0) && (
                    <p className="section-sub">No completed sales yet.</p>
                  )}
                </div>

                <div className="analytics-card">
                  <h3>Order Status Breakdown</h3>
                  {Object.entries(
                    adminData.analytics?.transactionStatuses || {},
                  ).map(([status, count]) => (
                    <div className="analytics-product-row" key={status}>
                      <strong>{status}</strong>
                      <strong>{count}</strong>
                    </div>
                  ))}
                </div>

                <div className="analytics-card">
                  <h3>Recent Orders</h3>
                  {(adminData.analytics?.recentOrders || []).map((order) => (
                    <div className="analytics-product-row" key={order._id}>
                      <div>
                        <strong>{order.listing?.title || "Furniture"}</strong>
                        <small>
                          Buyer: {order.buyer?.name || "Unknown"} · Seller:{" "}
                          {order.seller?.name || "Unknown"}
                        </small>
                        <small>
                          {new Date(order.createdAt).toLocaleDateString(
                            "en-IN",
                          )}
                        </small>
                      </div>
                      <div>
                        <strong>
                          ₹
                          {Number(order.agreedPrice || 0).toLocaleString(
                            "en-IN",
                          )}
                        </strong>
                        <small>{order.status}</small>
                      </div>
                    </div>
                  ))}

                  {(!adminData.analytics?.recentOrders ||
                    adminData.analytics.recentOrders.length === 0) && (
                    <p className="section-sub">No orders available yet.</p>
                  )}
                </div>
              </div>

              {/* LISTING REVIEW */}
              <div className="my-listings saved-listings" id="admin-listings">
                <h3>Listing review</h3>

                {adminData.listings.slice(0, 30).map((listing) => (
                  <div className="admin-row" key={listing._id}>
                    <img src={imageUrl(listing.images?.[0])} alt="" />

                    <div>
                      <strong>{listing.title}</strong>
                      <small>
                        {listing.seller?.name} · {listing.status}
                      </small>
                    </div>

                    <select
                      value={listing.status}
                      onChange={(event) =>
                        updateAdminRecord(
                          `/admin/listings/${listing._id}`,
                          event.target.value,
                          "listing",
                        )
                      }
                    >
                      <option value="ACTIVE">Live</option>
                      <option value="SOLD">Sold</option>
                      <option value="REJECTED">Reject</option>
                      <option value="INACTIVE">Pause</option>
                    </select>
                  </div>
                ))}
              </div>

              {/* REPORTED LISTINGS */}
              <div className="my-listings saved-listings" id="admin-reports">
                <h3>Reported listings</h3>

                {adminData.reports.map((report) => (
                  <div className="admin-report" key={report._id}>
                    <strong>
                      {report.listing?.title || "Listing removed"} ·{" "}
                      {report.reason}
                    </strong>

                    <small>
                      Reported by {report.reporter?.name} · {report.status}
                    </small>

                    {report.details && <p>{report.details}</p>}

                    {report.status === "OPEN" && (
                      <div>
                        <button
                          onClick={() =>
                            updateAdminRecord(
                              `/admin/reports/${report._id}`,
                              "REVIEWED",
                              "report",
                            )
                          }
                        >
                          Mark reviewed
                        </button>

                        <button
                          onClick={() =>
                            updateAdminRecord(
                              `/admin/reports/${report._id}`,
                              "DISMISSED",
                              "report",
                            )
                          }
                        >
                          Dismiss
                        </button>

                        <button
                          onClick={() =>
                            report.listing?._id &&
                            updateAdminRecord(
                              `/admin/listings/${report.listing._id}`,
                              "INACTIVE",
                              "listing",
                            )
                          }
                        >
                          Pause listing
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* MEMBER ACCOUNTS */}
              <div className="my-listings saved-listings" id="admin-users">
                <h3>Member accounts</h3>

                {adminData.users.slice(0, 30).map((member) => (
                  <div className="admin-row" key={member._id}>
                    <div className="admin-user-avatar">{member.name?.[0]}</div>

                    <div>
                      <strong>{member.name}</strong>
                      <small>
                        {member.email} · {member.role} · {member.status}
                      </small>
                    </div>

                    <button
                      className="small-action"
                      onClick={() =>
                        updateAdminRecord(
                          `/admin/users/${member._id}`,
                          member.status === "ACTIVE" ? "BLOCKED" : "ACTIVE",
                          "user",
                        )
                      }
                    >
                      {member.status === "ACTIVE" ? "Block" : "Unblock"}
                    </button>
                  </div>
                ))}
              </div>

              {/* REVIEWS */}
              <div className="my-listings saved-listings" id="admin-reviews">
                <h3>Reviews</h3>

                {adminData.reviews.map((review) => (
                  <div className="admin-row" key={review._id}>
                    <div>
                      <strong>
                        {"★".repeat(review.rating)}
                        {"☆".repeat(5 - review.rating)} ·{" "}
                        {review.reviewer?.name} → {review.recipient?.name}
                      </strong>

                      <small>
                        {review.comment || "No comment"} · {review.status}
                      </small>
                    </div>

                    <button
                      className="small-action"
                      onClick={() =>
                        updateAdminRecord(
                          `/admin/reviews/${review._id}`,
                          review.status === "VISIBLE" ? "HIDDEN" : "VISIBLE",
                          "review",
                        )
                      }
                    >
                      {review.status === "VISIBLE" ? "Hide" : "Show"}
                    </button>
                  </div>
                ))}
              </div>

              {/* CATEGORIES */}
              <div className="my-listings saved-listings" id="admin-categories">
                <h3>Categories</h3>

                <form className="category-form" onSubmit={saveCategory}>
                  <input
                    name="name"
                    placeholder="New category"
                    maxLength="40"
                    required
                  />

                  <input name="icon" placeholder="Icon" maxLength="8" />

                  <button className="outline-btn">Add</button>
                </form>

                {adminData.categories.map((item) => (
                  <div className="admin-row" key={item._id}>
                    <span className="cat-icon">{item.icon}</span>

                    <div>
                      <strong>{item.name}</strong>
                      <small>
                        {item.active ? "Visible in marketplace" : "Hidden"}
                      </small>
                    </div>

                    <button
                      className="small-action"
                      onClick={() =>
                        updateCategory(item, { active: !item.active })
                      }
                    >
                      {item.active ? "Hide" : "Show"}
                    </button>

                    <button
                      className="small-action danger-action"
                      onClick={() => removeCategory(item)}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <>
      <header className="topbar">
        <div className="top-inner">
          <a className="brand" href="#">
            <span className="brand-mark">
              f<span>↗</span>
            </span>
            <span>
              furni<span className="brand-light">loop</span>
              <small>FURNITURE, IN GOOD COMPANY</small>
            </span>
          </a>
          <form className="location location-form" onSubmit={applyLocation}>
            <FiMapPin />
            <input
              name="location"
              aria-label="Filter furniture by city or area"
              placeholder="City or area"
              defaultValue={location}
            />
            <button type="submit" aria-label="Apply location filter">
              <FiArrowRight />
            </button>
          </form>
          <div className="header-search">
            <FiSearch />
            <input
              placeholder="Find your next favourite piece..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <button aria-label="Search">
              <FiArrowRight />
            </button>
          </div>
          <nav className={menu ? "nav open" : "nav"}>
            <a href="#browse">Explore</a>
            <a href="#how">How it works</a>
            {user?.role === "admin" && (
              <button className="login" onClick={openAdmin}>
                Admin
              </button>
            )}
            {user && (
              <button
                className="notification-button"
                aria-label="Notifications"
                onClick={openNotifications}
              >
                <FiBell />
                {unreadNotifications > 0 && (
                  <span>
                    {unreadNotifications > 9 ? "9+" : unreadNotifications}
                  </span>
                )}
              </button>
            )}
            {user ? (
              <button className="login" onClick={openDashboard}>
                <FiUser />
                {user.name.split(" ")[0]}
              </button>
            ) : (
              <button className="login" onClick={() => showAuth("login")}>
                <FiUser /> Log in
              </button>
            )}
            <button className="sell-btn" onClick={() => startSell()}>
              <FiPlus /> Sell an item
            </button>
          </nav>
          <button
            className="mobile-menu"
            onClick={() => setMenu(!menu)}
            aria-label="Open menu"
          >
            <FiMenu />
          </button>
        </div>
      </header>
      <main>
        <section className="hero">
          <div className="hero-content">
            <div className="eyebrow">
              <span></span> A MORE THOUGHTFUL WAY TO FURNISH
            </div>
            <h1>
              Good furniture
              <br />
              deserves <em>another</em>
              <br />
              <em>chapter.</em>
            </h1>
            <p>
              Find pieces with a past, and make them part of your story. Shop
              pre-loved furniture from people near you.
            </p>
            <div className="hero-actions">
              <a href="#browse" className="primary-link">
                Explore furniture <FiArrowRight />
              </a>
              <button className="text-link" onClick={() => startSell()}>
                Have something to sell? <span>Start here</span>
              </button>
            </div>
            <div className="hero-proof">
              <div className="avatar-stack">
                <b>A</b>
                <b>R</b>
                <b>M</b>
                <b>+</b>
              </div>
              <div>
                <strong>2,400+ pieces</strong>
                <small>finding a new home</small>
              </div>
              <span className="proof-divider"></span>
              <div className="rating">
                ★★★★★ <small>Loved by our community</small>
              </div>
            </div>
          </div>
          <div className="hero-image">
            <img
              src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=90"
              alt="A warm, thoughtfully furnished living room"
            />
            <div className="image-note">
              <span className="note-icon">
                <FiFeather />
              </span>
              <div>
                <strong>Good for your home.</strong>
                <small>Even better for the planet.</small>
              </div>
            </div>
            <div className="image-index">
              01 <span>/</span> 04
            </div>
          </div>
          <div className="hero-side-label">
            THOUGHTFULLY PRE-LOVED · ALWAYS ONE OF A KIND
          </div>
        </section>
        <section className="trust-strip">
          <div>
            <FiShield />
            <span>
              <strong>Buy with confidence</strong>
              <small>Real people, real pieces</small>
            </span>
          </div>
          <div>
            <FiMapPin />
            <span>
              <strong>Find it close by</strong>
              <small>Good things, nearby</small>
            </span>
          </div>
          <div>
            <FiFeather />
            <span>
              <strong>Choose circular</strong>
              <small>Less waste, more character</small>
            </span>
          </div>
          <div>
            <FiMessageCircle />
            <span>
              <strong>Talk directly</strong>
              <small>Connect with the seller</small>
            </span>
          </div>
        </section>
        <section className="categories-section" id="browse">
          <div className="section-heading">
            <div>
              <div className="eyebrow dark">
                <span></span> FIND YOUR KIND OF COMFORT
              </div>
              <h2>
                Shop by <em>category</em>
              </h2>
            </div>
            <a href="#listings" className="quiet-link">
              View all furniture <FiArrowRight />
            </a>
          </div>
          <div className="category-row">
            {categories.map(([name, icon]) => (
              <button
                className={`category-card ${category === name ? "selected" : ""}`}
                onClick={() => {
                  setCategory(name);
                  document
                    .getElementById("listings")
                    .scrollIntoView({ behavior: "smooth" });
                }}
                key={name}
              >
                <span className="cat-icon">{icon}</span>
                <span>{name}</span>
                <span className="cat-arrow">↗</span>
              </button>
            ))}
          </div>
        </section>
        <section className="listings" id="listings">
          <div className="section-heading listing-head">
            <div>
              <div className="eyebrow dark">
                <span></span> THE GOOD FINDS
              </div>
              <h2>
                {category === "All furniture" ? "Freshly listed" : category}{" "}
                <em>for you</em>
              </h2>
              <p className="section-sub">
                One-of-a-kind pieces, ready for their next home.
              </p>
            </div>
            <div className="listing-controls">
              <span>{loading ? "Loading…" : `${visible.length} pieces`}</span>
              <label>
                <FiSliders />
                <select
                  value={sort}
                  onChange={(event) => submitSort(event.target.value)}
                >
                  <option>Recommended</option>
                  <option>Newest first</option>
                  <option>Price: low to high</option>
                </select>
                <FiChevronDown />
              </label>
            </div>
          </div>
          {demoMode && !loading && (
            <div className="demo-notice">
              Preview mode: sample furniture is shown. Start the API and MongoDB
              to use live listings and accounts.
            </div>
          )}
          <div className="product-grid">
            {visible.map((item) => (
              <article className="product-card" key={item.id}>
                <div
                  className="product-photo"
                  onClick={() => setModal(`item:${item.id}`)}
                >
                  <img src={imageUrl(item.image)} alt={item.title} />
                  {item.tag && <span className="product-tag">{item.tag}</span>}
                  <button
                    className={`heart ${saved.includes(item.id) ? "is-saved" : ""}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleFavorite(item);
                    }}
                    aria-label="Save listing"
                  >
                    <FiHeart
                      fill={saved.includes(item.id) ? "currentColor" : "none"}
                    />
                  </button>
                  <span className="condition">{item.condition}</span>
                </div>
                <div className="product-info">
                  <div className="product-title-row">
                    <h3>{item.title}</h3>
                    <span className="price">
                      ₹{item.price.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="price-note">
                    Originally ₹{Math.round(item.old).toLocaleString("en-IN")}
                  </div>
                  <div className="product-meta">
                    <span>
                      <FiMapPin />
                      {item.place}
                    </span>
                    <span>{item.time}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
          {!loading && visible.length === 0 && (
            <div className="empty">
              <span>⌕</span>
              <h3>No pieces found just yet</h3>
              <p>Try a different search or browse another category.</p>
              <button
                onClick={() => {
                  setQuery("");
                  setCategory("All furniture");
                }}
              >
                Clear filters
              </button>
            </div>
          )}
          <div className="more-row">
            <button
              className="outline-btn"
              onClick={() => notice("You’re all caught up!")}
            >
              See all furniture <FiArrowRight />
            </button>
          </div>
        </section>
        <section className="sell-banner">
          <div className="sell-copy">
            <div className="eyebrow">
              <span></span> MAKE ROOM FOR WHAT'S NEXT
            </div>
            <h2>
              Someone's looking
              <br />
              for <em>your something.</em>
            </h2>
            <p>
              That chair you’ve outgrown? The table that’s seen a thousand
              dinners? Give it a new home (and make a little room while you’re
              at it).
            </p>
            <button className="cream-btn" onClick={() => startSell()}>
              List a piece for free <FiArrowRight />
            </button>
          </div>
          <div className="sell-picture">
            <img
              src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1100&q=85"
              alt="A bright, calm living space"
            />
            <div className="floating-card">
              <span>✳</span>
              <div>
                <strong>Good things go around.</strong>
                <small>List in just a few minutes</small>
              </div>
            </div>
          </div>
        </section>
        <section className="how" id="how">
          <div className="eyebrow dark">
            <span></span> SIMPLE AS PASSING IT ON
          </div>
          <h2>
            A better way to <em>find your fit.</em>
          </h2>
          <div className="steps">
            <div>
              <span className="step-no">01</span>
              <span className="step-icon">⌕</span>
              <h3>Find your piece</h3>
              <p>Browse thoughtful finds from people in your neighbourhood.</p>
            </div>
            <div>
              <span className="step-no">02</span>
              <span className="step-icon">↗</span>
              <h3>Make it yours</h3>
              <p>
                Message the seller, ask questions, and agree on a fair price.
              </p>
            </div>
            <div>
              <span className="step-no">03</span>
              <span className="step-icon">✳</span>
              <h3>Give it a new home</h3>
              <p>Arrange pickup together and enjoy a piece with a story.</p>
            </div>
          </div>
        </section>
        <section className="about-section" id="about">
          <div className="eyebrow dark">
            <span></span> FURNITURE, IN GOOD COMPANY
          </div>
          <h2>
            A home for furniture with <em>a past.</em>
          </h2>
          <p>
            We believe good furniture deserves to be used and loved for longer.
            FurniLoop helps neighbours pass pieces along, find something with
            character, and furnish thoughtfully without buying new.
          </p>
          <a href="#browse" className="quiet-link">
            Explore the marketplace <FiArrowRight />
          </a>
        </section>
        <section className="faq-section" id="faq">
          <div className="eyebrow dark">
            <span></span> GOOD TO KNOW
          </div>
          <h2>
            A few <em>frequently asked</em> things.
          </h2>
          <div className="faq-list">
            <details>
              <summary>How does buying work?</summary>
              <p>
                Message the seller to ask questions and arrange a viewing. If
                you agree on a price, coordinate payment and pickup directly
                with them.
              </p>
            </details>
            <details>
              <summary>Can I both buy and sell?</summary>
              <p>
                Yes. One FurniLoop account lets you browse, save, message
                sellers, and list furniture of your own.
              </p>
            </details>
            <details>
              <summary>How do I list furniture?</summary>
              <p>
                Create an account, add photos and honest details, set your price
                and location, then publish. You can edit, pause, or mark a
                listing sold from your account.
              </p>
            </details>
            <details>
              <summary>Does FurniLoop handle payments or delivery?</summary>
              <p>
                Not in this version. Buyers and sellers agree directly on
                payment, collection, and delivery arrangements.
              </p>
            </details>
          </div>
        </section>
      </main>
      <footer>
        <div className="footer-main">
          <div className="brand footer-brand">
            <span className="brand-mark">
              f<span>↗</span>
            </span>
            <span>
              furni<span className="brand-light">loop</span>
              <small>FURNITURE, IN GOOD COMPANY</small>
            </span>
          </div>
          <p>
            Good furniture deserves another chapter.
            <br />
            Find yours on FurniLoop.
          </p>
          <div className="footer-links">
            <a href="#browse">Explore furniture</a>
            <a href="#how">How it works</a>
            <a href="#about">Our story</a>
            <a href="#faq">FAQs</a>
            <button onClick={() => startSell()}>Sell with us</button>
          </div>
          <div className="footer-signoff">
            Made for homes with a past
            <br />
            <span>and a future. ✳</span>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2025 FurniLoop. A little more thoughtful.</span>
          <span>Made for the circular home&nbsp; · &nbsp;Bengaluru, India</span>
        </div>
      </footer>
      {toast && (
        <div className="toast">
          <FiCheck />
          {toast}
        </div>
      )}
      {modal && (
        <div
          className={`modal-backdrop ${modal === "admin" ? "admin-backdrop" : ""}`}
          onClick={() => {
            setModal("");
            setFormError("");
          }}
        >
          <div
            className={`modal ${modal === "admin" ? "admin-fullscreen" : ""}`}
            onClick={(event) => event.stopPropagation()}
          >
            <button className="modal-close" onClick={() => setModal("")}>
              <FiX />
            </button>
            {modal === "sell" && (
              <>
                <div className="eyebrow dark">
                  <span></span> GIVE IT ANOTHER CHAPTER
                </div>
                <h2>{editing ? "Edit your listing" : "List a piece"}</h2>
                <p className="modal-intro">
                  {editing
                    ? "Update the details buyers see."
                    : "A few details and it could find its next home."}
                </p>
                <form onSubmit={handleListing}>
                  <label>
                    What are you selling?
                    <input
                      name="title"
                      defaultValue={editing?.title}
                      placeholder="e.g. Solid wood coffee table"
                      minLength="3"
                      maxLength="100"
                      required
                    />
                  </label>
                  <label>
                    Tell buyers about it
                    <textarea
                      name="description"
                      defaultValue={editing?.description}
                      placeholder="Share the story, details, and anything a buyer should know"
                      maxLength="3000"
                      required
                    />
                  </label>
                  <div className="form-row">
                    <label>
                      Category
                      <select
                        name="category"
                        defaultValue={editing?.category || "Sofas"}
                      >
                        {categories.slice(1).map(([name]) => (
                          <option key={name}>{name}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Condition
                      <select
                        name="condition"
                        defaultValue={editing?.condition || "Very good"}
                      >
                        <option>Very good</option>
                        <option>Like new</option>
                        <option>Good</option>
                        <option>Fair</option>
                      </select>
                    </label>
                  </div>
                  <div className="form-row">
                    <label>
                      Your price (₹)
                      <input
                        name="price"
                        type="number"
                        min="1"
                        defaultValue={editing?.price}
                        placeholder="450"
                        required
                      />
                    </label>
                    <label>
                      Original price (₹)
                      <input
                        name="originalPrice"
                        type="number"
                        min="1"
                        defaultValue={editing?.originalPrice}
                        placeholder="Optional"
                      />
                    </label>
                  </div>
                  <div className="form-row">
                    <label>
                      City
                      <input
                        name="city"
                        defaultValue={editing?.city}
                        placeholder="Bengaluru"
                        required
                      />
                    </label>
                    <label>
                      Area / neighbourhood
                      <input
                        name="area"
                        defaultValue={editing?.area}
                        placeholder="Indiranagar"
                      />
                    </label>
                  </div>
                  <label>
                    Material
                    <input
                      name="material"
                      defaultValue={editing?.material}
                      placeholder="Oak, teak, rattan…"
                    />
                  </label>
                  <div className="form-row">
                    <label>
                      Dimensions
                      <input
                        name="dimensions"
                        defaultValue={editing?.dimensions}
                        placeholder="W × H × D (optional)"
                      />
                    </label>
                    <label>
                      Purchase year
                      <input
                        name="purchaseYear"
                        type="number"
                        min="1900"
                        max={new Date().getFullYear()}
                        defaultValue={editing?.purchaseYear}
                        placeholder="Optional"
                      />
                    </label>
                  </div>

                  <label className="photo-picker">
                    Furniture photos
                    <small className="form-hint">
                      Upload photos or add direct image URLs. Maximum 8 photos.
                    </small>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      multiple
                      onChange={handlePhotoUpload}
                    />
                  </label>

                  <p className="form-hint">OR add photo using URL</p>

                  <div className="form-row">
                    <input
                      type="url"
                      placeholder="https://example.com/furniture.jpg"
                      value={photoUrl}
                      onChange={(e) => setPhotoUrl(e.target.value)}
                    />
                    <button type="button" onClick={addPhotoUrl}>
                      Add URL
                    </button>
                  </div>

                  {uploadedImages.length > 0 && (
                    <div className="uploaded-images">
                      {uploadedImages.map((url, index) => (
                        <div key={`${url}-${index}`}>
                          <img src={url} alt="Furniture preview" />
                          <button
                            type="button"
                            onClick={() =>
                              setUploadedImages((current) =>
                                current.filter((_, i) => i !== index),
                              )
                            }
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      <span>{uploadedImages.length} photos added</span>
                    </div>
                  )}

                  {uploading && <p className="form-hint">Uploading photos…</p>}
                  {formError && <p className="form-error">{formError}</p>}
                  <button className="submit-btn">
                    {editing ? "Save changes" : "Publish listing"}{" "}
                    <FiArrowRight />
                  </button>
                </form>
              </>
            )}
            {modal === "auth" && (
              <>
                <div className="eyebrow dark">
                  <span></span>{" "}
                  {authMode === "admin"
                    ? "FURNILOOP ADMINISTRATION"
                    : "WELCOME TO FURNILOOP"}
                </div>
                <h2>
                  {authMode === "admin"
                    ? "Administrator sign in."
                    : authMode === "register"
                      ? "Make yourself at home."
                      : authMode === "forgot"
                        ? "Reset your password."
                        : authMode === "reset"
                          ? "Choose a new password."
                          : "Good to have you here."}
                </h2>
                <p className="modal-intro">
                  {authMode === "admin"
                    ? "Sign in with your administrator account to manage FurniLoop."
                    : authMode === "register"
                      ? "Create one account to buy and sell. We’ll email you a verification link."
                      : authMode === "forgot"
                        ? "Enter your email and we’ll send a reset link if there is an account for it."
                        : authMode === "reset"
                          ? "Use a password with at least 8 characters."
                          : "Sign in to save finds and manage your listings."}
                </p>
                <form onSubmit={handleAuth}>
                  {authMode === "register" && (
                    <label>
                      Your name
                      <input
                        name="name"
                        autoComplete="name"
                        minLength="2"
                        maxLength="80"
                        placeholder="Name"
                        required
                      />
                    </label>
                  )}
                  {(authMode === "register" ||
                    authMode === "login" ||
                    authMode === "admin" ||
                    authMode === "forgot") && (
                    <label>
                      Email address
                      <input
                        name="email"
                        type="email"
                        autoComplete="email"
                        defaultValue={unverifiedEmail}
                        placeholder="you@example.com"
                        required
                      />
                    </label>
                  )}
                  {(authMode === "register" ||
                    authMode === "login" ||
                    authMode === "admin" ||
                    authMode === "reset") && (
                    <label>
                      {authMode === "reset" ? "New password" : "Password"}
                      <input
                        name="password"
                        type="password"
                        autoComplete={
                          authMode === "register" || authMode === "reset"
                            ? "new-password"
                            : "current-password"
                        }
                        minLength="8"
                        placeholder="At least 8 characters"
                        required
                      />
                    </label>
                  )}
                  {authMode === "reset" && (
                    <label>
                      Confirm new password
                      <input
                        name="confirmPassword"
                        type="password"
                        minLength="8"
                        placeholder="Type it again"
                        required
                      />
                    </label>
                  )}
                  {formError && <p className="form-error">{formError}</p>}
                  {unverifiedEmail && authMode === "login" && (
                    <button
                      type="button"
                      className="text-link resend-link"
                      onClick={resendVerification}
                    >
                      Resend verification email
                    </button>
                  )}
                  <button className="submit-btn">
                    {authMode === "register"
                      ? "Create account"
                      : authMode === "admin"
                        ? "Sign in as admin"
                        : authMode === "forgot"
                          ? "Send reset link"
                          : authMode === "reset"
                            ? "Save new password"
                            : "Continue"}{" "}
                    <FiArrowRight />
                  </button>
                </form>
                {authMode === "login" && (
                  <>
                    <button
                      className="text-link forgot-link"
                      onClick={() => {
                        setAuthMode("forgot");
                        setFormError("");
                      }}
                    >
                      Forgot password?
                    </button>
                    <p className="auth-switch">
                      <button
                        onClick={() => {
                          setAuthMode("admin");
                          setFormError("");
                        }}
                      >
                        Administrator sign in
                      </button>
                    </p>
                  </>
                )}
                {(authMode === "login" || authMode === "register") && (
                  <p className="auth-switch">
                    {authMode === "register"
                      ? "Already have an account?"
                      : "New to FurniLoop?"}{" "}
                    <button
                      onClick={() => {
                        setAuthMode(
                          authMode === "register" ? "login" : "register",
                        );
                        setFormError("");
                      }}
                    >
                      {authMode === "register" ? "Log in" : "Create account"}
                    </button>
                  </p>
                )}
                {(authMode === "admin" ||
                  authMode === "forgot" ||
                  authMode === "reset") && (
                  <p className="auth-switch">
                    <button
                      onClick={() => {
                        setAuthMode("login");
                        setFormError("");
                      }}
                    >
                      Back to member sign in
                    </button>
                  </p>
                )}
              </>
            )}
            {modal === "dashboard" && (
              <>
                <div className="eyebrow dark">
                  <span></span> YOUR FURNILOOP
                </div>
                <h2>Hello, {user?.name.split(" ")[0]}.</h2>
                <p className="modal-intro">
                  Manage your listings, offers, messages, and saved finds.
                </p>
                <div className="dashboard-actions">
                  <button className="outline-btn" onClick={handleLogout}>
                    <FiLogOut /> Sign out
                  </button>
                  <button className="submit-btn" onClick={() => startSell()}>
                    <FiPlus /> List furniture
                  </button>
                </div>
                <div className="my-listings">
                  <h3>
                    <FiPackage /> Your listings
                  </h3>
                  {myListings.length === 0 && (
                    <p className="section-sub">
                      You haven’t listed anything yet.
                    </p>
                  )}
                  {myListings.map((item) => (
                    <div className="my-listing" key={item.id}>
                      <img src={imageUrl(item.image)} alt="" />
                      <div>
                        <strong>{item.title}</strong>
                        <small>
                          ₹{item.price.toLocaleString("en-IN")} · {item.status}
                        </small>
                      </div>
                      <button
                        className="small-action"
                        onClick={() => startSell(item)}
                      >
                        Edit
                      </button>
                      <select
                        value={item.status}
                        onChange={(event) =>
                          updateListingStatus(item, event.target.value)
                        }
                      >
                        <option value="ACTIVE">Live</option>
                        <option value="SOLD">Sold</option>
                        <option value="INACTIVE">Paused</option>
                      </select>
                    </div>
                  ))}
                </div>
                <div className="my-listings saved-listings">
                  <h3>
                    <FiHeart /> Saved furniture
                  </h3>
                  {savedItems.length === 0 && (
                    <p className="section-sub">
                      Tap the heart on a listing to save it here.
                    </p>
                  )}
                  {savedItems.map((item) => (
                    <button
                      className="saved-item"
                      key={item.id}
                      onClick={() => setModal(`item:${item.id}`)}
                    >
                      <img src={imageUrl(item.image)} alt="" />
                      <span>{item.title}</span>
                      <strong>₹{item.price.toLocaleString("en-IN")}</strong>
                    </button>
                  ))}
                </div>
                <div className="my-listings saved-listings">
                  <h3>
                    <FiMessageCircle /> Messages
                  </h3>
                  {conversations.length === 0 && (
                    <p className="section-sub">
                      Your buyer and seller conversations will show here.
                    </p>
                  )}
                  {conversations.map((conversation) => (
                    <button
                      className="saved-item"
                      key={conversation._id}
                      onClick={() => openConversation(null, conversation)}
                    >
                      <img
                        src={imageUrl(conversation.listing?.images?.[0])}
                        alt=""
                      />
                      <span>
                        {conversation.listing?.title ||
                          "Furniture conversation"}
                        <small className="conversation-person">
                          {" "}
                          with{" "}
                          {String(conversation.buyer?._id) === String(user?.id)
                            ? conversation.seller?.name
                            : conversation.buyer?.name}
                        </small>
                      </span>
                      <FiArrowRight />
                    </button>
                  ))}
                </div>
                <div className="my-listings saved-listings">
                  <h3>Offers received</h3>
                  {receivedOffers.length === 0 && (
                    <p className="section-sub">
                      Offers from interested buyers will show here.
                    </p>
                  )}
                  {receivedOffers.map((offer) => (
                    <div className="offer-row" key={offer._id}>
                      <div>
                        <strong>
                          {offer.listing?.title || "Furniture listing"}
                        </strong>
                        <small>
                          ₹{offer.amount.toLocaleString("en-IN")} from{" "}
                          {offer.buyer?.name} · {offer.status}
                        </small>
                        {offer.message && <small>“{offer.message}”</small>}
                      </div>
                      {offer.status === "PENDING" && (
                        <form className="offer-response">
                          <input
                            name="counterPrice"
                            type="number"
                            min="1"
                            placeholder="Counter ₹"
                          />
                          <div>
                            <button
                              type="button"
                              onClick={(event) =>
                                handleOfferDecision(
                                  offer,
                                  "ACCEPTED",
                                  event.currentTarget.form,
                                )
                              }
                            >
                              Accept
                            </button>
                            <button
                              type="button"
                              onClick={(event) =>
                                handleOfferDecision(
                                  offer,
                                  "REJECTED",
                                  event.currentTarget.form,
                                )
                              }
                            >
                              Decline
                            </button>
                            <button
                              type="button"
                              onClick={(event) =>
                                handleOfferDecision(
                                  offer,
                                  "COUNTERED",
                                  event.currentTarget.form,
                                )
                              }
                            >
                              Counter
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  ))}
                </div>
                <div className="my-listings saved-listings">
                  <h3>Offers sent</h3>
                  {sentOffers.length === 0 && (
                    <p className="section-sub">
                      Offers you make on furniture will show here.
                    </p>
                  )}
                  {sentOffers.map((offer) => (
                    <div className="offer-row" key={offer._id}>
                      <div>
                        <strong>
                          {offer.listing?.title || "Furniture listing"}
                        </strong>
                        <small>
                          Your offer: ₹{offer.amount.toLocaleString("en-IN")} ·{" "}
                          {offer.status}
                        </small>
                        {offer.counterPrice && (
                          <small>
                            Counteroffer: ₹
                            {offer.counterPrice.toLocaleString("en-IN")}
                          </small>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="my-listings saved-listings">
                  <h3>Transactions</h3>
                  {transactions.length === 0 && (
                    <p className="section-sub">
                      Accepted offers and purchase arrangements will show here.
                    </p>
                  )}
                  {transactions.map((transaction) => {
                    const buyerSide =
                      String(transaction.buyer?._id) === String(user?.id);
                    const alreadyReviewed = givenReviews.some(
                      (review) =>
                        String(review.transaction?._id) ===
                        String(transaction._id),
                    );
                    return (
                      <div className="transaction-row" key={transaction._id}>
                        <div>
                          <strong>
                            {transaction.listing?.title ||
                              "Furniture transaction"}
                          </strong>
                          <small>
                            ₹{transaction.agreedPrice.toLocaleString("en-IN")} ·{" "}
                            {buyerSide ? "Buying from" : "Selling to"}{" "}
                            {buyerSide
                              ? transaction.seller?.name
                              : transaction.buyer?.name}{" "}
                            · {transaction.status}
                          </small>
                        </div>
                        {transaction.status === "ARRANGING" && (
                          <div className="transaction-actions">
                            <button
                              onClick={() =>
                                updateTransaction(transaction, "COMPLETED")
                              }
                            >
                              Mark complete
                            </button>
                            <button
                              onClick={() =>
                                updateTransaction(transaction, "CANCELLED")
                              }
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                        {transaction.status === "COMPLETED" &&
                          !alreadyReviewed && (
                            <form
                              className="review-form"
                              onSubmit={(event) =>
                                sendReview(event, transaction)
                              }
                            >
                              <select name="rating" defaultValue="5">
                                <option value="5">★★★★★</option>
                                <option value="4">★★★★</option>
                                <option value="3">★★★</option>
                                <option value="2">★★</option>
                                <option value="1">★</option>
                              </select>
                              <input
                                name="comment"
                                maxLength="1000"
                                placeholder="Share a quick note (optional)"
                              />
                              <button>Leave review</button>
                            </form>
                          )}
                      </div>
                    );
                  })}
                </div>
                <div className="my-listings saved-listings">
                  <h3>Reviews about you</h3>
                  {receivedReviews.length === 0 && (
                    <p className="section-sub">
                      Verified transaction feedback will appear here.
                    </p>
                  )}
                  {receivedReviews.map((review) => (
                    <div className="review-row" key={review._id}>
                      <strong>
                        {"★".repeat(review.rating)}
                        {"☆".repeat(5 - review.rating)}
                      </strong>
                      <span>{review.comment || "No written comment"}</span>
                      <small>by {review.reviewer?.name}</small>
                    </div>
                  ))}
                </div>
              </>
            )}
            {modal.startsWith("item:") &&
              (() => {
                const item =
                  items.find((listing) => listing.id === modal.slice(5)) ||
                  savedItems.find((listing) => listing.id === modal.slice(5));
                if (!item) return null;
                return (
                  <>
                    <div className="eyebrow dark">
                      <span></span> A GOOD FIND
                    </div>
                    <h2>{item.title}</h2>
                    <div className="detail-image">
                      <img src={imageUrl(item.image)} alt={item.title} />
                    </div>
                    <div className="detail-price">
                      ₹{item.price.toLocaleString("en-IN")}{" "}
                      <span>{item.condition}</span>
                    </div>
                    <p className="modal-intro">
                      {item.description ||
                        "Contact the seller to ask about this piece, arrange a viewing, and agree on pickup."}
                    </p>
                    <button
                      className="seller-profile-link"
                      onClick={() => openSellerProfile(item)}
                    >
                      <FiUser /> {item.seller} <span>{item.place}</span>
                      <FiArrowRight />
                    </button>
                    {item.material && (
                      <p className="seller-line">
                        Material: {item.material}
                        {item.dimensions ? ` · ${item.dimensions}` : ""}
                      </p>
                    )}
                    <div className="detail-actions">
                      {item.sellerId !== user?.id && (
                        <button
                          className="submit-btn"
                          onClick={() => openConversation(item)}
                        >
                          <FiMessageCircle /> Message seller
                        </button>
                      )}
                      {item.sellerId !== user?.id &&
                        !item.id.startsWith("demo-") && (
                          <>
                            <form
                              className="offer-form"
                              onSubmit={(event) => sendOffer(event, item)}
                            >
                              <label>
                                Make an offer (₹)
                                <input
                                  type="number"
                                  min="1"
                                  name="amount"
                                  placeholder={String(item.price)}
                                  required
                                />
                              </label>
                              <label>
                                Note (optional)
                                <input
                                  name="message"
                                  maxLength="500"
                                  placeholder="Add a short message"
                                />
                              </label>
                              {formError && (
                                <p className="form-error">{formError}</p>
                              )}
                              <button className="outline-btn">
                                Send offer <FiArrowRight />
                              </button>
                            </form>
                            <button
                              className="report-link"
                              onClick={() => {
                                if (!user) {
                                  showAuth("login");
                                  return;
                                }
                                setFormError("");
                                setModal(`report:${item.id}`);
                              }}
                            >
                              Report listing
                            </button>
                          </>
                        )}
                    </div>
                  </>
                );
              })()}
            {modal === "chat" && (
              <>
                <div className="eyebrow dark">
                  <span></span> FURNILOOP MESSAGES
                </div>
                <h2>{activeListing?.title || "Conversation"}</h2>
                <p className="modal-intro">
                  Coordinate questions and pickup directly with the other
                  member.
                </p>
                <div className="chat-messages">
                  {messages.map((message) => (
                    <div
                      className={`chat-message ${message.sender?._id === user?.id ? "mine" : ""}`}
                      key={message._id}
                    >
                      <small>
                        {message.sender?.name || "Member"} ·{" "}
                        {new Date(message.createdAt).toLocaleString()}
                      </small>
                      <p>{message.body}</p>
                    </div>
                  ))}
                  {messages.length === 0 && (
                    <p className="section-sub">
                      Say hello and ask about the piece.
                    </p>
                  )}
                </div>
                <form className="chat-compose" onSubmit={sendMessage}>
                  <textarea
                    name="body"
                    placeholder="Write a message…"
                    maxLength="2000"
                    required
                  />
                  <button className="submit-btn">
                    <FiArrowRight />
                  </button>
                </form>
              </>
            )}
            {modal === "notifications" && (
              <>
                <div className="eyebrow dark">
                  <span></span> YOUR FURNILOOP
                </div>
                <h2>Notifications</h2>
                <p className="modal-intro">
                  Messages, offers, and updates about your furniture.
                </p>
                {unreadNotifications > 0 && (
                  <button
                    className="mark-read-button"
                    onClick={async () => {
                      await api("/notifications/read-all", {
                        method: "POST",
                      }).catch(() => null);
                      setNotifications((current) =>
                        current.map((item) => ({
                          ...item,
                          readAt: item.readAt || new Date().toISOString(),
                        })),
                      );
                      setUnreadNotifications(0);
                    }}
                  >
                    Mark all as read
                  </button>
                )}
                <div className="notification-list">
                  {notifications.length === 0 && (
                    <p className="section-sub">You’re all caught up.</p>
                  )}
                  {notifications.map((notification) => (
                    <button
                      className={`notification-item ${notification.readAt ? "" : "unread"}`}
                      key={notification._id}
                      onClick={() => activateNotification(notification)}
                    >
                      <span className="notification-dot" />
                      <span>
                        <strong>{notification.title}</strong>
                        <small>{notification.body}</small>
                        <small>
                          {new Date(notification.createdAt).toLocaleString()}
                        </small>
                      </span>
                      <FiArrowRight />
                    </button>
                  ))}
                </div>
              </>
            )}
            {modal === "seller" && sellerProfile && (
              <>
                <div className="eyebrow dark">
                  <span></span> FURNILOOP MEMBER
                </div>
                <div className="seller-profile-head">
                  <div>{sellerProfile.member.name?.[0]}</div>
                  <section>
                    <h2>{sellerProfile.member.name}</h2>
                    <small>
                      Member since{" "}
                      {new Date(
                        sellerProfile.member.since,
                      ).toLocaleDateString()}
                    </small>
                  </section>
                </div>
                <div className="seller-rating">
                  <strong>
                    {sellerProfile.average
                      ? `${sellerProfile.average} / 5`
                      : "New member"}
                  </strong>
                  <span>
                    {sellerProfile.count
                      ? `★ ${sellerProfile.count} verified review${sellerProfile.count === 1 ? "" : "s"}`
                      : "No reviews yet"}
                  </span>
                </div>
                <div className="profile-reviews">
                  {sellerProfile.reviews.map((review) => (
                    <article key={review._id}>
                      <strong>
                        {"★".repeat(review.rating)}
                        {"☆".repeat(5 - review.rating)}
                      </strong>
                      <p>{review.comment || "No written comment"}</p>
                      <small>{review.reviewer?.name}</small>
                    </article>
                  ))}
                </div>
              </>
            )}{" "}
            {modal.startsWith("report:") &&
              (() => {
                const item = items.find(
                  (listing) => listing.id === modal.slice(7),
                );
                if (!item) return null;
                return (
                  <>
                    <div className="eyebrow dark">
                      <span></span> HELP KEEP FURNILOOP TRUSTWORTHY
                    </div>
                    <h2>Report this listing</h2>
                    <p className="modal-intro">
                      Reports go to the FurniLoop moderation team.
                    </p>
                    <form onSubmit={(event) => submitReport(event, item)}>
                      <label>
                        Reason
                        <select name="reason">
                          <option>Misleading information</option>
                          <option>Prohibited item</option>
                          <option>Suspicious seller</option>
                          <option>Duplicate listing</option>
                          <option>Other</option>
                        </select>
                      </label>
                      <label>
                        More detail (optional)
                        <textarea
                          name="details"
                          maxLength="1000"
                          placeholder="Tell us what concerned you"
                        />
                      </label>
                      {formError && <p className="form-error">{formError}</p>}
                      <button className="submit-btn">
                        Send report <FiArrowRight />
                      </button>
                    </form>
                  </>
                );
              })()}
            {modal === "admin" && <></>}
          </div>
        </div>
      )}
    </>
  );
}

createRoot(document.getElementById("root")).render(<App />);
