import axiosClient from "../../api/axiosClient";

export const patientProfileApi = async () => {
  const { data } = await axiosClient.get("/patient/profile");
  return data;
};

export const updatePatientProfileApi = async (payload) => {
  const { data } = await axiosClient.put("/patient/profile", payload);
  return data;
};

export const changePatientPasswordApi = async (payload) => {
  const { data } = await axiosClient.patch("/patient/profile/password", payload);
  return data;
};

export const patientDoctorsApi = async () => {
  const { data } = await axiosClient.get("/patient/doctors");
  return data;
};

export const patientDoctorSlotsApi = async (doctorId) => {
  const { data } = await axiosClient.get(`/patient/doctors/${doctorId}/slots`);
  return data;
};

export const bookPatientAppointmentApi = async (payload) => {
  const { data } = await axiosClient.post("/patient/appointments", payload);
  return data;
};

export const patientAppointmentsApi = async () => {
  const { data } = await axiosClient.get("/patient/appointments");
  return data;
};

export const cancelPatientAppointmentApi = async (id) => {
  const { data } = await axiosClient.delete(`/patient/appointments/${id}`);
  return data;
};

export const reopenPatientAppointmentApi = async (id) => {
  const { data } = await axiosClient.patch(`/patient/appointments/${id}/reopen`);
  return data;
};

export const patientPrescriptionsApi = async () => {
  const { data } = await axiosClient.get("/patient/prescriptions");
  return data;
};

export const patientReportsApi = async () => {
  const { data } = await axiosClient.get("/patient/reports");
  return data;
};
