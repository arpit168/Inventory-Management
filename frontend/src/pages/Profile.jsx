import { useState, useRef, useEffect } from "react";
import {
  Camera,
  Check,
  User,
  Lock,
  Moon,
  Sun,
  ShieldCheck,
  Upload,
  Trash2,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import api from "../services/api";

const Profile = () => {
  const { user, updateUser, toggleTheme, theme } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState(user?.name || "");
  const [nameLoading, setNameLoading] = useState(false);

  const [avatarLoading, setAvatarLoading] = useState(false);
  const [photoMenuOpen, setPhotoMenuOpen] = useState(false);
  const [showWebcam, setShowWebcam] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [pwdLoading, setPwdLoading] = useState(false);

  const handleUpdateName = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setNameLoading(true);
    try {
      const res = await api.put("/auth/profile", { name });
      updateUser(res.data.user);
      showToast("Name updated successfully", "success");
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to update profile",
        "error",
      );
    } finally {
      setNameLoading(false);
    }
  };

  const uploadFile = async (file) => {
    if (file.size > 5 * 1024 * 1024) {
      showToast("Image file size must be under 5MB", "warning");
      return;
    }

    const formData = new FormData();
    formData.append("image", file);

    setAvatarLoading(true);
    try {
      showToast("Uploading image...", "info");
      const uploadRes = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const imageUrl = uploadRes.data.url;

      const profileRes = await api.put("/auth/profile", { avatar: imageUrl });
      updateUser(profileRes.data.user);
      showToast("Profile picture updated!", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Image upload failed", "error");
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    setPhotoMenuOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemovePhoto = async () => {
    setPhotoMenuOpen(false);
    setAvatarLoading(true);
    try {
      const profileRes = await api.put("/auth/profile", { avatar: "" });
      updateUser(profileRes.data.user);
      showToast("Profile picture removed", "success");
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to remove photo",
        "error",
      );
    } finally {
      setAvatarLoading(false);
    }
  };

  const startCamera = async () => {
    setPhotoMenuOpen(false);
    setShowWebcam(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
      streamRef.current = stream;
    } catch (err) {
      console.error("Camera error:", err);
      showToast("Camera access denied or unavailable.", "error");
      setShowWebcam(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setShowWebcam(false);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      stopCamera();
      if (!blob) return;
      const file = new File([blob], "camera-capture.jpg", {
        type: "image/jpeg",
      });
      uploadFile(file);
    }, "image/jpeg");
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();
    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      showToast("Enter all password fields.", "warning");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast("New passwords do not match.", "warning");
      return;
    }
    setPwdLoading(true);
    try {
      await api.put("/auth/change-password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      showToast("Password changed successfully.", "success");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      showToast(
        error.response?.data?.message || "Unable to change password.",
        "error",
      );
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-primary font-extrabold mb-1">
            Profile & Settings
          </p>
          <h1 className="text-2xl sm:text-3xl font-black text-text tracking-tight">
            Account Management
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Manage personal details, avatar profile, and account security
            credentials.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Avatar & Overview */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-xs text-center flex flex-col items-center">
            <div className="relative group w-fit mx-auto">
              <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-full overflow-hidden border-4 border-primary shadow-lg bg-primary/20 flex items-center justify-center text-4xl font-black text-primary">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  user?.name?.charAt(0)?.toUpperCase() || "U"
                )}
              </div>

              <button
                type="button"
                onClick={() => setPhotoMenuOpen(!photoMenuOpen)}
                disabled={avatarLoading}
                className="absolute bottom-1 right-1 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-primary text-slate-950 shadow-md transition hover:scale-110 hover:bg-primary-hover active:scale-95"
              >
                <Camera size={18} />
              </button>

              {photoMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setPhotoMenuOpen(false)}
                  ></div>
                  <div className="absolute top-[105%] left-1/2 -translate-x-1/2 sm:left-auto sm:-translate-x-0 sm:right-[-20px] mt-2 w-56 bg-surface border border-border rounded-xl shadow-xl z-20 overflow-hidden text-sm animate-fade-in text-left">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-background transition text-left text-text font-medium"
                    >
                      <Upload size={16} className="text-primary" /> Upload from
                      Files
                    </button>
                    <button
                      type="button"
                      onClick={startCamera}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-background transition text-left text-text font-medium border-t border-border"
                    >
                      <Camera size={16} className="text-primary" /> Capture from
                      Camera
                    </button>
                    {user?.avatar && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-500/10 transition text-left text-red-500 font-medium border-t border-border"
                      >
                        <Trash2 size={16} /> Remove Photo
                      </button>
                    )}
                  </div>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>

            {avatarLoading && (
              <p className="text-xs font-bold text-primary mt-3 animate-pulse">
                Uploading profile photo...
              </p>
            )}

            <h2 className="mt-4 text-xl font-black text-text">{user?.name}</h2>
            <p className="text-xs font-medium text-text-muted mt-0.5">
              {user?.email}
            </p>

            <div className="mt-6 w-full pt-6 border-t border-border space-y-3.5 text-left">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted font-bold uppercase tracking-wider">
                  Account Role
                </span>
                <span className="inline-flex items-center gap-1 font-extrabold rounded-full bg-primary/15 px-3 py-1 text-primary">
                  <ShieldCheck size={14} /> Administrator
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted font-bold uppercase tracking-wider">
                  Interface Theme
                </span>
                <button
                  onClick={toggleTheme}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 font-bold text-text hover:border-primary transition shadow-xs"
                >
                  {theme === "dark" ? (
                    <Sun size={14} className="text-warning" />
                  ) : (
                    <Moon size={14} className="text-primary" />
                  )}
                  <span>{theme === "dark" ? "Dark Mode" : "Light Mode"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Edit Profile & Password */}
        <div className="lg:col-span-7 space-y-6">
          {/* Edit Name */}
          <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-2 text-primary font-extrabold text-xs uppercase tracking-widest mb-4">
              <User size={16} /> Personal Details
            </div>
            <form onSubmit={handleUpdateName} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-muted mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text font-semibold focus:border-primary focus:outline-hidden transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-muted mb-1.5">
                  Email Address (Read Only)
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ""}
                  className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text-muted cursor-not-allowed font-medium"
                />
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={nameLoading || name === user?.name}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-primary/20 hover:bg-primary-hover transition disabled:opacity-50 active:scale-98"
                >
                  <Check size={16} />{" "}
                  <span>{nameLoading ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Change Password */}
          <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-2 text-primary font-extrabold text-xs uppercase tracking-widest mb-4">
              <Lock size={16} /> Security & Password
            </div>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-muted mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      currentPassword: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text focus:border-primary focus:outline-hidden transition"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-text-muted mb-1.5">
                    New Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        newPassword: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text focus:border-primary focus:outline-hidden transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-muted mb-1.5">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        confirmPassword: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text focus:border-primary focus:outline-hidden transition"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={pwdLoading}
                  className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-primary/20 hover:bg-primary-hover transition disabled:opacity-50 active:scale-98"
                >
                  <span>{pwdLoading ? "Updating..." : "Update Password"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Webcam Modal */}
      {showWebcam && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4">
          <div className="bg-surface p-4 rounded-2xl w-full max-w-lg border border-border shadow-2xl relative">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-text flex items-center gap-2">
                <Camera size={20} className="text-primary" /> Capture Photo
              </h3>
              <button
                onClick={stopCamera}
                className="text-text-muted hover:text-text transition bg-background p-1.5 rounded-lg border border-border hover:border-text-muted"
              >
                <X size={20} />
              </button>
            </div>
            <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center border border-border">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              ></video>
            </div>
            <div className="mt-6 flex justify-center">
              <button
                onClick={capturePhoto}
                className="h-16 w-16 rounded-full bg-primary flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition border-4 border-primary/30"
              >
                <Camera size={24} className="text-slate-950" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
