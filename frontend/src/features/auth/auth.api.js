import axiosClient from "../../api/axiosClient";

export const loginApi = async (payload) => {
  const { data } = await axiosClient.post("/auth/login", payload);
  return data;
};

export const patientOtpLoginApi = async (payload) => {
  const { data } = await axiosClient.post("/auth/login/patient-otp", payload);
  return data;
};

export const sendOtpApi = async (payload) => {
  const { data } = await axiosClient.post("/auth/otp/send", payload);
  return data;
};

export const verifyOtpApi = async (payload) => {
  const { data } = await axiosClient.post("/auth/otp/verify", payload);
  return data;
};

export const registerPatientApi = async (payload) => {
  const { data } = await axiosClient.post("/auth/register/patient", payload);
  return data;
};
