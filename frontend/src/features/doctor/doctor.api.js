import axiosClient from "../../api/axiosClient";

export const doctorProfileApi = async () => {
  const { data } = await axiosClient.get("/doctor/profile");
  return data;
};

export const updateDoctorProfileApi = async (payload) => {
  const { data } = await axiosClient.put("/doctor/profile", payload);
  return data;
};

export const changeDoctorPasswordApi = async (payload) => {
  const { data } = await axiosClient.patch("/doctor/profile/password", payload);
  return data;
};

export const listDoctorSlotsApi = async () => {
  const { data } = await axiosClient.get("/doctor/slots");
  return data;
};

export const createDoctorSlotApi = async (payload) => {
  const { data } = await axiosClient.post("/doctor/slots", payload);
  return data;
};

export const deleteDoctorSlotApi = async (id) => {
  const { data } = await axiosClient.delete(`/doctor/slots/${id}`);
  return data;
};

export const doctorAppointmentsApi = async (date) => {
  const { data } = await axiosClient.get("/doctor/appointments", {
    params: date ? { date } : {},
  });
  return data;
};

export const doctorAppointmentPatientApi = async (appointmentId) => {
  const { data } = await axiosClient.get(`/doctor/appointments/${appointmentId}/patient`);
  return data;
};

export const doctorAppointmentPrescriptionsApi = async (appointmentId) => {
  const { data } = await axiosClient.get(
    `/doctor/appointments/${appointmentId}/prescriptions`
  );
  return data;
};

export const doctorAppointmentReportsApi = async (appointmentId) => {
  const { data } = await axiosClient.get(`/doctor/appointments/${appointmentId}/reports`);
  return data;
};

export const doctorAppointmentHealthReportsApi = async (appointmentId) => {
  const { data } = await axiosClient.get(
    `/doctor/appointments/${appointmentId}/health-reports`
  );
  return data;
};

export const createDoctorPrescriptionApi = async (appointmentId, payload) => {
  const { data } = await axiosClient.post(
    `/doctor/appointments/${appointmentId}/prescription`,
    payload
  );
  return data;
};
