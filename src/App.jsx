import { Link, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { bookingApi, chatbotApi, eventApi, identityApi, userApi, setAuthToken } from "./api";

const useAuth = () => {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken("");
    setUser(null);
  };

  return { token, setToken, user, setUser, logout };
};

const FormMessage = ({ text }) => {
  if (!text) return null;
  return <p className="form-message">{text}</p>;
};

function RegisterPage() {
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const [message, setMessage] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    try {
      await identityApi.post("/register", form);
      setMessage("Account created successfully. Please login.");
    } catch (err) {
      setMessage(err?.response?.data?.message || "Registration failed.");
    }
  };

  return (
    <section className="auth-shell">
      <div className="surface-card auth-card">
        <h2>Create your account</h2>
        <p className="muted">Start booking premium events in seconds.</p>
        <form onSubmit={submit}>
          <label className="field-label" htmlFor="register-name">Full name</label>
          <input id="register-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Anant Kumar" />
          <label className="field-label" htmlFor="register-email">Email</label>
          <input id="register-email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@company.com" />
          <label className="field-label" htmlFor="register-password">Password</label>
          <input id="register-password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Enter a secure password" />
          <button type="submit" className="btn-primary">Create Account</button>
          <FormMessage text={message} />
        </form>
      </div>
    </section>
  );
}

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const { data } = await identityApi.post("/login", { email, password });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      onLogin(data.token, data.user);
      navigate("/events");
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed");
    }
  };

  return (
    <section className="auth-shell">
      <div className="surface-card auth-card">
        <h2>Welcome back</h2>
        <p className="muted">Login to manage events and bookings.</p>
        <form onSubmit={submit}>
          <label className="field-label" htmlFor="login-email">Email</label>
          <input id="login-email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" />
          <label className="field-label" htmlFor="login-password">Password</label>
          <input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" />
          <button type="submit" className="btn-primary">Sign In</button>
          <FormMessage text={error} />
        </form>
      </div>
    </section>
  );
}

function EventsPage({ user }) {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    eventApi.get("/").then((res) => setEvents(res.data));
  }, []);

  return (
    <section>
      <div className="page-header">
        <div>
          <h2>Featured Events</h2>
          <p className="muted">Discover curated experiences around the city.</p>
        </div>
        {user?.role === "admin" && <Link to="/events/create" className="btn-primary">Create Event</Link>}
      </div>

      <div className="event-grid">
        {events.map((eventItem) => (
          <article key={eventItem.id} className="surface-card event-card">
            <div className="event-meta">
              <span className="pill">{new Date(eventItem.date).toLocaleDateString()}</span>
              <span className="pill pill-secondary">{eventItem.available_seats} seats left</span>
            </div>
            <h3>{eventItem.name}</h3>
            <p className="muted">{eventItem.description}</p>
            <p><strong>Venue:</strong> {eventItem.venue}</p>
            <Link to={`/events/${eventItem.id}`} className="link-cta">View Details</Link>
          </article>
        ))}
      </div>
    </section>
  );
}

function EventDetailPage() {
  const { id } = useParams();
  const [eventItem, setEventItem] = useState(null);
  const [chatInput, setChatInput] = useState("");
  const [chatReply, setChatReply] = useState("");
  const [chatError, setChatError] = useState("");

  useEffect(() => {
    eventApi.get(`/${id}`).then((res) => setEventItem(res.data));
  }, [id]);

  const askChatbot = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    setChatError("");
    try {
      const { data } = await chatbotApi.post("/chat", {
        message: chatInput,
        eventId: Number(id)
      });
      setChatReply(data.reply);
      setChatInput("");
    } catch (error) {
      setChatError(error?.response?.data?.message || "Chatbot is unavailable right now.");
    }
  };

  if (!eventItem) return <p className="muted">Loading event details...</p>;

  return (
    <section className="surface-card detail-card">
      <h2>{eventItem.name}</h2>
      <p className="muted">{eventItem.description}</p>
      <div className="stats-row">
        <div className="stat-box"><span>Venue</span><strong>{eventItem.venue}</strong></div>
        <div className="stat-box"><span>Date</span><strong>{new Date(eventItem.date).toLocaleString()}</strong></div>
        <div className="stat-box"><span>Available Seats</span><strong>{eventItem.available_seats}</strong></div>
      </div>
      <Link to={`/book/${eventItem.id}`} className="btn-primary">Book Tickets</Link>

      <div className="chatbot-box">
        <h3>Event Assistant</h3>
        <p className="muted">Ask about date, venue, seats, or event highlights.</p>
        <form onSubmit={askChatbot} className="chatbot-form">
          <input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="e.g., How many seats are left?"
          />
          <button type="submit" className="btn-primary">Ask</button>
        </form>
        {chatReply && <p className="chatbot-reply">{chatReply}</p>}
        {chatError && <p className="form-message">{chatError}</p>}
      </div>
    </section>
  );
}

function BookingPage() {
  const { id } = useParams();
  const [seats, setSeats] = useState(1);
  const [message, setMessage] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    try {
      await bookingApi.post("/", { event_id: Number(id), seats: Number(seats) });
      setMessage("Booking successful.");
    } catch (err) {
      setMessage(err?.response?.data?.message || "Booking failed.");
    }
  };

  return (
    <section className="auth-shell">
      <div className="surface-card auth-card">
        <h2>Confirm your booking</h2>
        <p className="muted">Event ID: #{id}</p>
        <form onSubmit={submit}>
          <label className="field-label" htmlFor="seats">Number of seats</label>
          <input id="seats" type="number" min="1" value={seats} onChange={(e) => setSeats(e.target.value)} />
          <button type="submit" className="btn-primary">Confirm Booking</button>
          <FormMessage text={message} />
        </form>
      </div>
    </section>
  );
}

function CreateEventPage({ user }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    description: "",
    venue: "",
    date: "",
    total_seats: 100
  });
  const [message, setMessage] = useState("");

  if (user?.role !== "admin") {
    return <p className="muted">Only admin users can create events.</p>;
  }

  const submit = async (e) => {
    e.preventDefault();
    try {
      await eventApi.post("/", form);
      navigate("/events");
    } catch (err) {
      setMessage(err?.response?.data?.message || "Could not create event.");
    }
  };

  return (
    <section className="auth-shell">
      <div className="surface-card auth-card">
        <h2>Create a new event</h2>
        <p className="muted">Publish premium experiences for your audience.</p>
        <form onSubmit={submit}>
          <label className="field-label" htmlFor="event-name">Event name</label>
          <input id="event-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <label className="field-label" htmlFor="event-description">Description</label>
          <input id="event-description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <label className="field-label" htmlFor="event-venue">Venue</label>
          <input id="event-venue" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} />
          <label className="field-label" htmlFor="event-date">Date & time</label>
          <input id="event-date" type="datetime-local" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <label className="field-label" htmlFor="event-total-seats">Total seats</label>
          <input id="event-total-seats" type="number" min="1" value={form.total_seats} onChange={(e) => setForm({ ...form, total_seats: Number(e.target.value) })} />
          <button className="btn-primary" type="submit">Publish Event</button>
          <FormMessage text={message} />
        </form>
      </div>
    </section>
  );
}

function DashboardPage() {
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    userApi.get("/me").then((res) => setProfile(res.data));
    bookingApi.get("/").then((res) => setBookings(res.data));
  }, []);

  return (
    <section>
      <h2>Dashboard</h2>
      <p className="muted">Track your account and booking portfolio.</p>
      {profile && (
        <div className="surface-card profile-card">
          <h3>{profile.name}</h3>
          <p>{profile.email}</p>
          <span className="pill">{profile.role}</span>
        </div>
      )}

      <h3 className="section-title">Recent Bookings</h3>
      <div className="booking-grid">
        {bookings.map((booking) => (
          <article key={booking.id} className="surface-card">
            <p><strong>Booking #{booking.id}</strong></p>
            <p>Event ID: {booking.event_id}</p>
            <p>Seats: {booking.seats}</p>
            <p>Status: <span className="pill pill-secondary">{booking.status}</span></p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function App() {
  const { token, setToken, user, setUser, logout } = useAuth();

  const onLogin = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
  };

  return (
    <div className="app-shell">
      <div className="gradient-orb gradient-orb-a" />
      <div className="gradient-orb gradient-orb-b" />
      <main className="container">
        <nav className="navbar surface-card">
          <Link to="/events" className="navbar-brand">BookishTickets</Link>
          <div className="navbar-nav">
            <Link to="/">Register</Link>
            <Link to="/login">Login</Link>
            <Link to="/events">Events</Link>
            {token && <Link to="/dashboard">Dashboard</Link>}
            {token && user?.role === "admin" && <Link to="/events/create">Create Event</Link>}
            <button type="button" className="btn-ghost" onClick={logout} disabled={!token}>Logout</button>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage onLogin={onLogin} />} />
          <Route path="/events" element={<EventsPage user={user} />} />
          <Route path="/events/:id" element={<EventDetailPage />} />
          <Route path="/events/create" element={<CreateEventPage user={user} />} />
          <Route path="/book/:id" element={<BookingPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </main>
    </div>
  );
}
