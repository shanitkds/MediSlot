"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { PermissionGate } from "@/components/permissions/PermissionGate";
import { AccessDenied } from "@/components/permissions/AccessDenied";
import { PageContainer } from "@/components/common/PageContainer";
import { PageHeader } from "@/components/common/PageHeader";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Alert";
import { DepartmentSelect } from "@/components/medical/DepartmentSelect";
import {
  useDoctor,
  useCreateDoctorProfile,
  useUpdateDoctor,
} from "@/hooks/queries/useDoctorQuery";
import { useToast } from "@/contexts/ToastProvider";
import { useAuth } from "@/contexts/AuthProvider";
import { PERMISSIONS } from "@/constants/permissions";
import {
  FiSave,
  FiUser,
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiBriefcase,
  FiClock,
  FiArrowLeft,
  FiActivity,
} from "react-icons/fi";

export function CreateDoctorUserView({
  doctorId = null,
  mode = doctorId ? "edit" : "create",
  redirectPath = mode === "edit" ? `/doctors/${doctorId}` : "/users",
  backLabel = mode === "edit" ? "Back to Doctor Profile" : "Back to Users",
  backHref = mode === "edit" ? (doctorId ? `/doctors/${doctorId}` : "/doctors") : "/users",
}) {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { user, can } = useAuth();

  const isEdit = mode === "edit" && Boolean(doctorId);

  // Queries & Mutations
  const createMutation = useCreateDoctorProfile();
  const updateMutation = useUpdateDoctor();
  const {
    data: docData,
    isLoading: isDocLoading,
    error: fetchError,
    refetch,
  } = useDoctor(doctorId, {
    enabled: isEdit,
  });

  const doctor = docData?.data?.doctor || docData?.data || null;

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [departmentId, setDepartmentId] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [consultationDuration, setConsultationDuration] = useState(15);
  const [status, setStatus] = useState("active");

  // Validation & Error State
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  // Super Admin & Authorization Guards
  const isSuperAdmin = user?.role === "super_admin" || Boolean(user?.isSuperAdmin);
  const canEdit = isSuperAdmin || can(PERMISSIONS.DOCTORS_UPDATE) || user?.role === "admin";

  // Prepopulate doctor data when in edit mode
  useEffect(() => {
    if (isEdit && doctor) {
      const docUser = doctor.userId || doctor.user;
      setName(docUser?.name || doctor.name || "");
      setEmail(docUser?.email || doctor.email || "");

      const rawDept = doctor.departmentId || doctor.department;
      const deptId =
        rawDept && typeof rawDept === "object"
          ? rawDept._id || rawDept.id || ""
          : rawDept || "";
      setDepartmentId(String(deptId || ""));

      setSpecialization(doctor.specialization || "");
      setConsultationDuration(
        doctor.consultationDuration ?? doctor.slotDurationMinutes ?? 15
      );
      setStatus(doctor.status || (doctor.isActive ? "active" : "disabled"));
    }
  }, [isEdit, doctor]);

  const validateForm = () => {
    const errors = {};

    const trimmedName = name.trim();
    if (!trimmedName) {
      errors.name = "Doctor full name is required.";
    } else if (trimmedName.length < 2) {
      errors.name = "Doctor name must be at least 2 characters.";
    } else if (trimmedName.length > 80) {
      errors.name = "Doctor name cannot exceed 80 characters.";
    }

    if (!isEdit) {
      const trimmedEmail = email.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!trimmedEmail) {
        errors.email = "Email address is required.";
      } else if (!emailRegex.test(trimmedEmail)) {
        errors.email = "Please enter a valid email address.";
      }

      if (!password) {
        errors.password = "Initial password is required.";
      } else if (password.length < 8) {
        errors.password = "Password must be at least 8 characters.";
      } else if (password.length > 128) {
        errors.password = "Password cannot exceed 128 characters.";
      }
    }

    if (!departmentId) {
      errors.departmentId = "Please select a clinical department.";
    }

    const trimmedSpec = specialization.trim();
    if (!trimmedSpec) {
      errors.specialization = "Medical specialization is required.";
    } else if (trimmedSpec.length < 2) {
      errors.specialization = "Specialization must be at least 2 characters.";
    } else if (trimmedSpec.length > 100) {
      errors.specialization = "Specialization cannot exceed 100 characters.";
    }

    const durationNum = Number(consultationDuration);
    if (
      consultationDuration === "" ||
      consultationDuration === null ||
      consultationDuration === undefined
    ) {
      errors.consultationDuration = "Consultation duration is required.";
    } else if (
      isNaN(durationNum) ||
      !Number.isInteger(durationNum) ||
      durationNum < 5 ||
      durationNum > 180
    ) {
      errors.consultationDuration =
        "Duration must be an integer between 5 and 180 minutes.";
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      setError("Please fix the errors in the form before submitting.");
      return;
    }

    setFieldErrors({});

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({
          id: doctorId,
          name: name.trim(),
          departmentId,
          specialization: specialization.trim(),
          consultationDuration: Number(consultationDuration) || 15,
          status,
        });

        queryClient.invalidateQueries({ queryKey: ["doctors"] });
        queryClient.invalidateQueries({ queryKey: ["doctor", doctorId] });

        toast.success(`Doctor "${name.trim()}" updated successfully.`);
        router.push(redirectPath);
      } else {
        await createMutation.mutateAsync({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          departmentId,
          specialization: specialization.trim(),
          consultationDuration: Number(consultationDuration) || 15,
        });

        // Refresh query caches
        queryClient.invalidateQueries({ queryKey: ["doctors"] });
        queryClient.invalidateQueries({ queryKey: ["users"] });

        toast.success(`Doctor "${name.trim()}" created successfully.`);
        router.push(redirectPath);
      }
    } catch (err) {
      const message =
        err?.message ||
        (isEdit
          ? "Failed to update doctor profile."
          : "Failed to create doctor profile.");
      setError(message);
      toast.error(message);
      if (err?.fields) {
        setFieldErrors(err.fields);
      }
    }
  };

  // Authorization check
  const isAuthorized = isEdit ? canEdit : isSuperAdmin;
  if (user && !isAuthorized) {
    return (
      <PageContainer maxWidth="compact" className="py-12">
        <AccessDenied
          title={isEdit ? "Doctor Update Access Denied" : "Super Admin Access Required"}
          description={
            isEdit
              ? "You do not have permission to edit doctor profiles."
              : "Only Super Administrators are permitted to create new doctor profiles and practitioner accounts."
          }
        />
      </PageContainer>
    );
  }

  const isSubmitting = isEdit ? updateMutation.isPending : createMutation.isPending;

  // Handle loading state in edit mode
  if (isEdit && isDocLoading) {
    return (
      <PageContainer maxWidth="compact" className="space-y-6">
        <Breadcrumbs />
        <LoadingState message="Loading doctor profile..." fullPage={false} />
      </PageContainer>
    );
  }

  // Handle fetch error in edit mode
  if (isEdit && fetchError) {
    return (
      <PageContainer maxWidth="compact" className="space-y-6">
        <Breadcrumbs />
        <ErrorState error={fetchError} onRetry={refetch} />
      </PageContainer>
    );
  }

  const pageTitle = isEdit
    ? doctor
      ? `Edit Dr. ${doctor.userId?.name || doctor.name || "Doctor"}`
      : "Edit Doctor"
    : "New Doctor";

  const pageDescription = isEdit
    ? "Update doctor practitioner account and configure their clinical profile."
    : "Create a doctor practitioner account and configure their clinical profile.";

  return (
    <PermissionGate
      roles={isEdit ? ["super_admin", "admin"] : ["super_admin"]}
      permission={isEdit ? PERMISSIONS.DOCTORS_UPDATE : undefined}
      fallback={
        <PageContainer maxWidth="compact" className="py-12">
          <AccessDenied
            title={isEdit ? "Doctor Update Access Denied" : "Super Admin Access Required"}
            description={
              isEdit
                ? "You do not have permission to edit doctor profiles."
                : "Only Super Administrators are permitted to create new doctor profiles and practitioner accounts."
            }
          />
        </PageContainer>
      }
    >
      <PageContainer maxWidth="compact" className="space-y-6">
        <Breadcrumbs />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <PageHeader
            title={pageTitle}
            description={pageDescription}
          />
          <Link href={backHref || redirectPath}>
            <Button variant="outline" size="sm" className="gap-2 shrink-0">
              <FiArrowLeft className="h-4 w-4" />
              {backLabel}
            </Button>
          </Link>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6 sm:p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {error && (
              <Alert
                variant="danger"
                title={isEdit ? "Update Error" : "Registration Error"}
              >
                {error}
              </Alert>
            )}

            {/* Section 1: User Account & Login Credentials */}
            <div className="space-y-4">
              <div className="border-b border-border pb-2">
                <h3 className="text-base font-semibold text-text">Account Credentials</h3>
                <p className="text-xs text-muted">
                  Doctor identity and portal login information.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Doctor Full Name"
                  placeholder="e.g. Dr. Emily Stone"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (fieldErrors.name)
                      setFieldErrors((prev) => ({ ...prev, name: null }));
                  }}
                  error={fieldErrors.name}
                  leftIcon={<FiUser className="h-4 w-4" />}
                  required
                  disabled={isSubmitting}
                />

                <Input
                  label="Email Address"
                  type="email"
                  placeholder="doctor@hospital.org"
                  value={email}
                  onChange={(e) => {
                    if (!isEdit) {
                      setEmail(e.target.value);
                      if (fieldErrors.email)
                        setFieldErrors((prev) => ({ ...prev, email: null }));
                    }
                  }}
                  error={fieldErrors.email}
                  hint={
                    isEdit
                      ? "Registered portal login email cannot be changed."
                      : fieldErrors.email
                      ? undefined
                      : "Unique email address for portal access."
                  }
                  leftIcon={<FiMail className="h-4 w-4" />}
                  required={!isEdit}
                  disabled={isSubmitting || isEdit}
                />
              </div>

              {!isEdit && (
                <div>
                  <Input
                    label="Account Password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimum 8 characters"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password)
                        setFieldErrors((prev) => ({ ...prev, password: null }));
                    }}
                    error={fieldErrors.password}
                    hint={
                      fieldErrors.password
                        ? undefined
                        : "Temporary initial password (min 8 characters)."
                    }
                    leftIcon={<FiLock className="h-4 w-4" />}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-muted hover:text-text transition-colors p-1"
                        tabIndex={-1}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <FiEyeOff className="h-4 w-4" />
                        ) : (
                          <FiEye className="h-4 w-4" />
                        )}
                      </button>
                    }
                    required
                    disabled={isSubmitting}
                  />
                </div>
              )}
            </div>

            {/* Section 2: Clinical Profile Configuration */}
            <div className="space-y-4 pt-2">
              <div className="border-b border-border pb-2">
                <h3 className="text-base font-semibold text-text">Clinical Information</h3>
                <p className="text-xs text-muted">
                  Department assignment, medical specialization, and consultation timing.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DepartmentSelect
                  label="Assigned Department"
                  value={departmentId}
                  onChange={(id) => {
                    setDepartmentId(id);
                    if (fieldErrors.departmentId)
                      setFieldErrors((prev) => ({ ...prev, departmentId: null }));
                  }}
                  error={fieldErrors.departmentId}
                  hint={
                    fieldErrors.departmentId
                      ? undefined
                      : "Clinical department where doctor practices."
                  }
                  required
                  disabled={isSubmitting}
                />

                <Input
                  label="Medical Specialization"
                  placeholder="e.g. Cardiology, Pediatrics"
                  value={specialization}
                  onChange={(e) => {
                    setSpecialization(e.target.value);
                    if (fieldErrors.specialization)
                      setFieldErrors((prev) => ({
                        ...prev,
                        specialization: null,
                      }));
                  }}
                  error={fieldErrors.specialization}
                  hint={
                    fieldErrors.specialization
                      ? undefined
                      : "Doctor's clinical field or expertise."
                  }
                  leftIcon={<FiBriefcase className="h-4 w-4" />}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Consultation Duration (Minutes)"
                  type="number"
                  min="5"
                  max="180"
                  step="1"
                  value={consultationDuration}
                  onChange={(e) => {
                    setConsultationDuration(e.target.value);
                    if (fieldErrors.consultationDuration) {
                      setFieldErrors((prev) => ({
                        ...prev,
                        consultationDuration: null,
                      }));
                    }
                  }}
                  error={fieldErrors.consultationDuration}
                  hint="Duration per consultation slot (5 to 180 minutes, default: 15)."
                  leftIcon={<FiClock className="h-4 w-4" />}
                  required
                  disabled={isSubmitting}
                />

                {isEdit && (
                  <Select
                    label="Practitioner Profile Status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    disabled={isSubmitting}
                    hint="Set whether doctor is available for bookings or inactive."
                  >
                    <option value="active">Active Practitioner</option>
                    <option value="disabled">Disabled / Inactive</option>
                  </Select>
                )}
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(backHref || redirectPath)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={isSubmitting}
                className="gap-2"
              >
                <FiSave className="h-4 w-4" />
                {isEdit ? "Save Changes" : "Create Doctor"}
              </Button>
            </div>
          </form>
        </div>
      </PageContainer>
    </PermissionGate>
  );
}

export const DoctorFormView = CreateDoctorUserView;
