import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import AppShell from "../components/AppShellReference";
import DataTable from "../components/DataTable";
import Modal from "../components/ModalEnhanced";
import {
  changeSuperAdminPasswordApi,
  createUserApi,
  deleteUserApi,
  listUsersApi,
  superAdminProfileApi,
  toggleUserApi,
  updateSuperAdminProfileApi,
  updateUserApi,
} from "../features/superAdmin/superAdmin.api";
import { confirmAction } from "../utils/confirmAction";
import { validateSuperAdminUser } from "../utils/validation";
import { validatePasswordChange, validateProfile } from "../utils/validation";

const navItems = [{ label: "User Management", to: "/super-admin" }];

const emptyForm = {
  name: "",
  email: "",
  mobile: "",
  password: "",
  role: "admin",
};

const SuperAdminPage = () => {
  const [users, setUsers] = useState([]);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openProfileModal, setOpenProfileModal] = useState(false);
  const [openPasswordModal, setOpenPasswordModal] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [profileErrors, setProfileErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const normalizeUserForm = (value) => ({
    ...value,
    name: value.name.trimStart(),
    email: value.email.trim(),
    mobile: String(value.mobile || "").replace(/\D/g, "").slice(0, 15),
    password: value.password,
    role: value.role,
  });

  const runUserValidation = (nextForm, isEditing = Boolean(editingId)) => {
    const normalized = normalizeUserForm(nextForm);
    const nextErrors = validateSuperAdminUser(normalized, isEditing);
    setFormErrors(nextErrors);
    return { normalized, nextErrors };
  };

  const updateUserFormField = (field, value) => {
    setForm((prev) => {
      const nextForm = normalizeUserForm({ ...prev, [field]: value });
      if (Object.keys(formErrors).length) {
        setFormErrors(validateSuperAdminUser(nextForm, Boolean(editingId)));
      }
      return nextForm;
    });
  };

  const openCreateModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormErrors({});
    setOpenAddModal(true);
  };

  const openUserEditModal = (user) => {
    setEditingId(user.id);
    setForm({
      name: user.name || "",
      email: user.email || "",
      mobile: user.mobile || "",
      password: "",
      role: user.role || "admin",
    });
    setFormErrors({});
    setOpenEditModal(true);
  };

  const closeCreateModal = () => {
    setOpenAddModal(false);
    setForm(emptyForm);
    setFormErrors({});
  };

  const closeEditModal = () => {
    setOpenEditModal(false);
    setEditingId(null);
    setForm(emptyForm);
    setFormErrors({});
  };

  const loadUsers = async () => {
    try {
      const [data, ownProfile] = await Promise.all([listUsersApi(), superAdminProfileApi()]);
      setUsers(data);
      setProfile(ownProfile);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load users");
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const submitForm = async (e) => {
    e.preventDefault();
    try {
      const { normalized, nextErrors } = runUserValidation(form, Boolean(editingId));
      if (Object.keys(nextErrors).length) return;
      if (editingId) {
        await updateUserApi(editingId, {
          name: normalized.name.trim(),
          email: normalized.email,
          mobile: normalized.mobile,
          role: normalized.role,
        });
        toast.success("User updated");
      } else {
        await createUserApi({
          ...normalized,
          name: normalized.name.trim(),
        });
        toast.success("User created");
      }
      setForm(emptyForm);
      setEditingId(null);
      setOpenAddModal(false);
      setOpenEditModal(false);
      loadUsers();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Operation failed");
    }
  };

  return (
    <AppShell
      title="Super Admin"
      navItems={navItems}
      userMenuActions={[
        { label: "Edit Profile", onClick: () => setOpenProfileModal(true) },
        { label: "Change Password", onClick: () => setOpenPasswordModal(true) },
      ]}
    >
      <div className="grid gap-4">
        <div className="glass-panel interactive-card rounded-[28px] p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Users</h3>
            <button
              className="rounded-2xl bg-gradient-to-r from-[#1f3f75] to-[#2d5daa] px-4 py-2 text-sm text-white"
              onClick={openCreateModal}
            >
              Add New
            </button>
          </div>
          <DataTable
            data={users}
            searchPlaceholder="Search users by name, email, role, or mobile"
            searchKeys={["name", "email", "role", "mobile"]}
            emptyMessage="No users available."
            columns={[
              { header: "Name", accessor: "name" },
              { header: "Email", accessor: "email" },
              { header: "Mobile", accessor: "mobile" },
              { header: "Role", render: (row) => <span className="capitalize">{row.role}</span> },
              {
                header: "Actions",
                render: (u) => (
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="rounded-xl bg-[#355c9a] px-3 py-1.5 text-xs text-white transition hover:bg-[#2b4b80]"
                      onClick={() => openUserEditModal(u)}
                    >
                      Edit
                    </button>
                    <button
                      className="rounded-xl bg-[#1f3f75] px-3 py-1.5 text-xs text-white transition hover:bg-[#19345f]"
                      onClick={async () => {
                        try {
                          await toggleUserApi(u.id);
                          toast.success("User status toggled");
                          loadUsers();
                        } catch (error) {
                          toast.error(error?.response?.data?.message || "Toggle failed");
                        }
                      }}
                    >
                      Toggle
                    </button>
                    <button
                      className="rounded-xl bg-[#10284c] px-3 py-1.5 text-xs text-white transition hover:bg-[#0c1f3a]"
                      onClick={async () => {
                        try {
                          if (!confirmAction("Are you sure you want to delete this user?")) return;
                          await deleteUserApi(u.id);
                          toast.success("User deleted");
                          loadUsers();
                        } catch (error) {
                          toast.error(error?.response?.data?.message || "Delete failed");
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ),
              },
            ]}
          />
        </div>
      </div>

      <Modal
        open={openAddModal}
        title="Add New User"
        onClose={closeCreateModal}
      >
        <form onSubmit={submitForm} className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Name</label>
          <input type="text" className={`w-full rounded-2xl border px-4 py-3 ${formErrors.name ? "field-error" : "border-slate-300"}`} placeholder="Name" value={form.name} onChange={(e) => updateUserFormField("name", e.target.value)} onBlur={() => runUserValidation(form, false)} />
          {formErrors.name && <p className="text-sm text-red-600">{formErrors.name}</p>}
          <label className="block text-sm font-medium text-slate-700">Email Address</label>
          <input type="email" className={`w-full rounded-2xl border px-4 py-3 ${formErrors.email ? "field-error" : "border-slate-300"}`} placeholder="Email" value={form.email} onChange={(e) => updateUserFormField("email", e.target.value)} onBlur={() => runUserValidation(form, false)} />
          {formErrors.email && <p className="text-sm text-red-600">{formErrors.email}</p>}
          <label className="block text-sm font-medium text-slate-700">Mobile Number</label>
          <input type="tel" inputMode="numeric" className={`w-full rounded-2xl border px-4 py-3 ${formErrors.mobile ? "field-error" : "border-slate-300"}`} placeholder="Mobile" value={form.mobile} onChange={(e) => updateUserFormField("mobile", e.target.value)} onBlur={() => runUserValidation(form, false)} />
          {formErrors.mobile && <p className="text-sm text-red-600">{formErrors.mobile}</p>}
          <label className="block text-sm font-medium text-slate-700">Password</label>
          <input type="password" className={`w-full rounded-2xl border px-4 py-3 ${formErrors.password ? "field-error" : "border-slate-300"}`} placeholder="Password" value={form.password} onChange={(e) => updateUserFormField("password", e.target.value)} onBlur={() => runUserValidation(form, false)} />
          {formErrors.password && <p className="text-sm text-red-600">{formErrors.password}</p>}
          <label className="block text-sm font-medium text-slate-700">Role</label>
          <select className={`w-full rounded-2xl border px-4 py-3 ${formErrors.role ? "field-error" : "border-slate-300"}`} value={form.role} onChange={(e) => updateUserFormField("role", e.target.value)} onBlur={() => runUserValidation(form, false)}>
            <option value="admin">Doctor (admin)</option>
            <option value="executive">Executive</option>
          </select>
          {formErrors.role && <p className="text-sm text-red-600">{formErrors.role}</p>}
          <button className="w-full rounded-2xl bg-gradient-to-r from-[#1f3f75] to-[#2d5daa] px-4 py-3 text-white">Create</button>
        </form>
      </Modal>

      <Modal
        open={openEditModal}
        title="Edit User"
        onClose={closeEditModal}
      >
        <form onSubmit={submitForm} className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Name</label>
          <input type="text" className={`w-full rounded-2xl border px-4 py-3 ${formErrors.name ? "field-error" : "border-slate-300"}`} placeholder="Name" value={form.name} onChange={(e) => updateUserFormField("name", e.target.value)} onBlur={() => runUserValidation(form, true)} />
          {formErrors.name && <p className="text-sm text-red-600">{formErrors.name}</p>}
          <label className="block text-sm font-medium text-slate-700">Email Address</label>
          <input type="email" className={`w-full rounded-2xl border px-4 py-3 ${formErrors.email ? "field-error" : "border-slate-300"}`} placeholder="Email" value={form.email} onChange={(e) => updateUserFormField("email", e.target.value)} onBlur={() => runUserValidation(form, true)} />
          {formErrors.email && <p className="text-sm text-red-600">{formErrors.email}</p>}
          <label className="block text-sm font-medium text-slate-700">Mobile Number</label>
          <input type="tel" inputMode="numeric" className={`w-full rounded-2xl border px-4 py-3 ${formErrors.mobile ? "field-error" : "border-slate-300"}`} placeholder="Mobile" value={form.mobile} onChange={(e) => updateUserFormField("mobile", e.target.value)} onBlur={() => runUserValidation(form, true)} />
          {formErrors.mobile && <p className="text-sm text-red-600">{formErrors.mobile}</p>}
          <label className="block text-sm font-medium text-slate-700">Role</label>
          <select className={`w-full rounded-2xl border px-4 py-3 ${formErrors.role ? "field-error" : "border-slate-300"}`} value={form.role} onChange={(e) => updateUserFormField("role", e.target.value)} onBlur={() => runUserValidation(form, true)}>
            <option value="admin">Doctor (admin)</option>
            <option value="executive">Executive</option>
          </select>
          {formErrors.role && <p className="text-sm text-red-600">{formErrors.role}</p>}
          <button className="w-full rounded-2xl bg-gradient-to-r from-[#1f3f75] to-[#2d5daa] px-4 py-3 text-white">Update</button>
        </form>
      </Modal>

      <Modal
        open={openProfileModal}
        title="Edit Profile"
        onClose={() => setOpenProfileModal(false)}
      >
        {profile && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                const nextErrors = validateProfile(profile);
                setProfileErrors(nextErrors);
                if (Object.keys(nextErrors).length) return;
                await updateSuperAdminProfileApi(profile);
                toast.success("Profile updated");
                setOpenProfileModal(false);
                loadUsers();
              } catch (error) {
                toast.error(error?.response?.data?.message || "Update failed");
              }
            }}
            className="space-y-2"
          >
            <label className="block text-sm font-medium text-slate-700">Name</label>
            <input className={`w-full rounded-2xl border px-4 py-3 ${profileErrors.name ? "field-error" : "border-slate-300"}`} placeholder="Name" value={profile.name || ""} onChange={(e) => { setProfile((prev) => ({ ...prev, name: e.target.value })); setProfileErrors((prev) => ({ ...prev, name: "" })); }} />
            {profileErrors.name && <p className="text-sm text-red-600">{profileErrors.name}</p>}
            <label className="block text-sm font-medium text-slate-700">Email Address</label>
            <input className={`w-full rounded-2xl border px-4 py-3 ${profileErrors.email ? "field-error" : "border-slate-300"}`} placeholder="Email" value={profile.email || ""} onChange={(e) => { setProfile((prev) => ({ ...prev, email: e.target.value })); setProfileErrors((prev) => ({ ...prev, email: "" })); }} />
            {profileErrors.email && <p className="text-sm text-red-600">{profileErrors.email}</p>}
            <label className="block text-sm font-medium text-slate-700">Mobile Number</label>
            <input className={`w-full rounded-2xl border px-4 py-3 ${profileErrors.mobile ? "field-error" : "border-slate-300"}`} placeholder="Mobile" value={profile.mobile || ""} onChange={(e) => { setProfile((prev) => ({ ...prev, mobile: e.target.value })); setProfileErrors((prev) => ({ ...prev, mobile: "" })); }} />
            {profileErrors.mobile && <p className="text-sm text-red-600">{profileErrors.mobile}</p>}
            <button className="w-full rounded-2xl bg-gradient-to-r from-[#1f3f75] to-[#2d5daa] px-4 py-3 text-white">Save Profile</button>
          </form>
        )}
      </Modal>

      <Modal
        open={openPasswordModal}
        title="Change Password"
        onClose={() => setOpenPasswordModal(false)}
      >
        <form
          className="space-y-2"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              const nextErrors = validatePasswordChange(passwordForm);
              setPasswordErrors(nextErrors);
              if (Object.keys(nextErrors).length) return;
              await changeSuperAdminPasswordApi(passwordForm);
              toast.success("Password updated");
              setPasswordForm({
                current_password: "",
                new_password: "",
                confirm_password: "",
              });
              setOpenPasswordModal(false);
            } catch (error) {
              toast.error(error?.response?.data?.message || "Password update failed");
            }
          }}
        >
          <label className="block text-sm font-medium text-slate-700">Current Password</label>
          <input type="password" className={`w-full rounded-2xl border px-4 py-3 ${passwordErrors.current_password ? "field-error" : "border-slate-300"}`} placeholder="Current password" value={passwordForm.current_password} onChange={(e) => { setPasswordForm((prev) => ({ ...prev, current_password: e.target.value })); setPasswordErrors((prev) => ({ ...prev, current_password: "" })); }} />
          {passwordErrors.current_password && <p className="text-sm text-red-600">{passwordErrors.current_password}</p>}
          <label className="block text-sm font-medium text-slate-700">New Password</label>
          <input type="password" className={`w-full rounded-2xl border px-4 py-3 ${passwordErrors.new_password ? "field-error" : "border-slate-300"}`} placeholder="New password" value={passwordForm.new_password} onChange={(e) => { setPasswordForm((prev) => ({ ...prev, new_password: e.target.value })); setPasswordErrors((prev) => ({ ...prev, new_password: "" })); }} />
          {passwordErrors.new_password && <p className="text-sm text-red-600">{passwordErrors.new_password}</p>}
          <label className="block text-sm font-medium text-slate-700">Confirm New Password</label>
          <input type="password" className={`w-full rounded-2xl border px-4 py-3 ${passwordErrors.confirm_password ? "field-error" : "border-slate-300"}`} placeholder="Confirm new password" value={passwordForm.confirm_password} onChange={(e) => { setPasswordForm((prev) => ({ ...prev, confirm_password: e.target.value })); setPasswordErrors((prev) => ({ ...prev, confirm_password: "" })); }} />
          {passwordErrors.confirm_password && <p className="text-sm text-red-600">{passwordErrors.confirm_password}</p>}
          <button className="w-full rounded-2xl bg-gradient-to-r from-[#1f3f75] to-[#2d5daa] px-4 py-3 text-white">Update Password</button>
        </form>
      </Modal>
    </AppShell>
  );
};

export default SuperAdminPage;
