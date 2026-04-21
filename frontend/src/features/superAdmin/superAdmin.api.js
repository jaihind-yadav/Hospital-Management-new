import axiosClient from "../../api/axiosClient";

export const superAdminProfileApi = async () => {
  const { data } = await axiosClient.get("/super-admin/profile");
  return data;
};

export const updateSuperAdminProfileApi = async (payload) => {
  const { data } = await axiosClient.put("/super-admin/profile", payload);
  return data;
};

export const changeSuperAdminPasswordApi = async (payload) => {
  const { data } = await axiosClient.patch("/super-admin/profile/password", payload);
  return data;
};

export const listUsersApi = async () => {
  const { data } = await axiosClient.get("/super-admin/users");
  return data;
};

export const createUserApi = async (payload) => {
  const { data } = await axiosClient.post("/super-admin/users", payload);
  return data;
};

export const updateUserApi = async (id, payload) => {
  const { data } = await axiosClient.put(`/super-admin/users/${id}`, payload);
  return data;
};

export const toggleUserApi = async (id) => {
  const { data } = await axiosClient.patch(`/super-admin/users/${id}/toggle`);
  return data;
};

export const deleteUserApi = async (id) => {
  const { data } = await axiosClient.delete(`/super-admin/users/${id}`);
  return data;
};
