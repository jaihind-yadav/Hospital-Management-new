export const getStoredUser = () => {
  const raw = localStorage.getItem("user");
  return raw ? JSON.parse(raw) : null;
};

export const roleHomeRoute = (role) => {
  if (role === "super_admin") return "/super-admin";
  if (role === "admin") return "/doctor";
  if (role === "patient") return "/patient";
  if (role === "executive") return "/executive";
  return "/login";
};
