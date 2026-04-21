import axiosClient from "../../api/axiosClient";

export const executiveProfileApi = async () => {
  const { data } = await axiosClient.get("/executive/profile");
  return data;
};

export const updateExecutiveProfileApi = async (payload) => {
  const { data } = await axiosClient.put("/executive/profile", payload);
  return data;
};

export const changeExecutivePasswordApi = async (payload) => {
  const { data } = await axiosClient.patch("/executive/profile/password", payload);
  return data;
};

export const executiveAppointmentsApi = async (date, doctorId) => {
  const { data } = await axiosClient.get("/executive/appointments", {
    params: {
      ...(date ? { date } : {}),
      ...(doctorId ? { doctor_id: doctorId } : {}),
    },
  });
  return data;
};

export const executiveDoctorsApi = async () => {
  const { data } = await axiosClient.get("/executive/doctors");
  return data;
};

export const executiveDoctorSlotsApi = async (doctorId) => {
  const { data } = await axiosClient.get(`/executive/doctors/${doctorId}/slots`);
  return data;
};

export const markAttendanceApi = async (id, is_present) => {
  const { data } = await axiosClient.patch(`/executive/appointments/${id}/attendance`, {
    is_present,
  });
  return data;
};

export const reopenExecutiveAppointmentApi = async (id) => {
  const { data } = await axiosClient.patch(`/executive/appointments/${id}/reopen`);
  return data;
};

export const executivePatientsApi = async (q) => {
  const { data } = await axiosClient.get("/executive/patients", {
    params: q ? { q } : {},
  });
  return data;
};

export const sendExecutiveBookingOtpApi = async (payload) => {
  const { data } = await axiosClient.post("/executive/booking/send-otp", payload);
  return data;
};

export const confirmExecutiveBookingApi = async (payload) => {
  const { data } = await axiosClient.post("/executive/booking/confirm", payload);
  return data;
};

export const executivePatientApi = async (patientId) => {
  const { data } = await axiosClient.get(`/executive/patients/${patientId}`);
  return data;
};

export const updateExecutivePatientProfileApi = async (patientId, payload) => {
  const { data } = await axiosClient.put(`/executive/patients/${patientId}/profile`, payload);
  return data;
};

export const executivePatientReportsApi = async (patientId) => {
  const { data } = await axiosClient.get(`/executive/patients/${patientId}/reports`);
  return data;
};

export const executivePatientHealthReportsApi = async (patientId) => {
  const { data } = await axiosClient.get(`/executive/patients/${patientId}/health-reports`);
  return data;
};

export const uploadPatientReportApi = async (patientId, file, reportDate) => {
  const formData = new FormData();
  formData.append("file", file);
  if (reportDate) formData.append("report_date", reportDate);
  const { data } = await axiosClient.post(`/executive/patients/${patientId}/reports`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

export const deleteReportApi = async (reportId) => {
  const { data } = await axiosClient.delete(`/executive/reports/${reportId}`);
  return data;
};

export const createHealthReportApi = async (patientId, payload) => {
  const { data } = await axiosClient.post(
    `/executive/patients/${patientId}/health-reports`,
    payload
  );
  return data;
};
