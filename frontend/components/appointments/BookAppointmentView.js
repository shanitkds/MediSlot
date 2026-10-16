"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FiCalendar,
  FiClock,
  FiUser,
  FiUserPlus,
  FiCheck,
  FiCheckCircle,
  FiAlertCircle,
  FiLayers,
  FiPhone,
  FiSearch,
  FiX,
  FiPrinter,
  FiArrowRight,
  FiRefreshCw,
  FiSun,
  FiSunset,
  FiMoon,
} from "react-icons/fi";
import { FaUserMd } from "react-icons/fa";
import { PermissionGate } from "@/components/permissions/PermissionGate";
import { PERMISSIONS } from "@/constants/permissions";
import { PageContainer } from "@/components/common/PageContainer";
import { PageHeader } from "@/components/common/PageHeader";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { usePatients, useCreatePatient } from "@/hooks/queries/usePatientQuery";
import { useDoctors } from "@/hooks/queries/useDoctorQuery";
import { useDepartments } from "@/hooks/queries/useDepartmentQuery";
import { useSlots } from "@/hooks/queries/useSlotQuery";
import { useBookAppointment } from "@/hooks/queries/useAppointmentQuery";
import { useAppointmentSocket } from "@/hooks/useAppointmentSocket";
import { useToast } from "@/contexts/ToastProvider";
import { useAuth } from "@/contexts/AuthProvider";
import { cn } from "@/lib/utils";

// Format helper for slot time
function formatSlotTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
}

// Group slots by morning, afternoon, evening
function getSlotPeriod(dateStr) {
  const d = new Date(dateStr);
  const hour = d.getUTCHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

// Format date YYYY-MM-DD helper
function getTodayString(offsetDays = 0) {
  const d = new Date();
  if (offsetDays) {
    d.setDate(d.getDate() + offsetDays);
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function BookAppointmentView() {
  const router = useRouter();
  const toast = useToast();
  const { user, can } = useAuth();

  // Real-time synchronization: automatically refetches slots & appointments when any user books or cancels
  useAppointmentSocket();

  // Step state
  const [activeTab, setActiveTab] = useState("search"); // 'search' | 'register'

  // Form Fields
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [purpose, setPurpose] = useState("");
  const [notes, setNotes] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [bookingSuccessData, setBookingSuccessData] = useState(null);

  // New Patient Form State (Inline Registration)
  const [newPatient, setNewPatient] = useState({
    name: "",
    mobile: "",
    patientId: "",
    gender: "male",
    dateOfBirth: "",
    bloodGroup: "",
    address: "",
  });
  const [newPatientErrors, setNewPatientErrors] = useState({});

  // API Queries
  // 1. Patients search query
  const {
    data: patientsData,
    isLoading: loadingPatients,
  } = usePatients(
    patientSearch.trim().length >= 1 ? { search: patientSearch.trim(), limit: 10 } : { limit: 5 }
  );

  const patientsList = useMemo(() => {
    return (
      patientsData?.data?.items ||
      patientsData?.data?.patients ||
      (Array.isArray(patientsData?.data) ? patientsData.data : [])
    );
  }, [patientsData]);

  // 2. Departments query
  const { data: deptData, isLoading: loadingDepartments } = useDepartments({ limit: 100 });
  const departments = useMemo(() => {
    return (
      deptData?.data?.items ||
      deptData?.data?.departments ||
      (Array.isArray(deptData?.data) ? deptData.data : [])
    );
  }, [deptData]);

  // 3. Doctors query (filtered by department if selected)
  const doctorParams = useMemo(() => {
    const params = { limit: 100, status: "active" };
    if (selectedDeptId) {
      params.departmentId = selectedDeptId;
    }
    return params;
  }, [selectedDeptId]);

  const { data: doctorsData, isLoading: loadingDoctors } = useDoctors(doctorParams);
  const doctors = useMemo(() => {
    return (
      doctorsData?.data?.items ||
      doctorsData?.data?.doctors ||
      (Array.isArray(doctorsData?.data) ? doctorsData.data : [])
    );
  }, [doctorsData]);

  // Find currently selected doctor object
  const selectedDoctor = useMemo(() => {
    if (!selectedDoctorId) return null;
    return doctors.find((d) => (d.id || d._id) === selectedDoctorId) || null;
  }, [selectedDoctorId, doctors]);

  // Auto-sync department when doctor changes if department wasn't already selected
  useEffect(() => {
    if (selectedDoctor && selectedDoctor.departmentId) {
      const docDeptId =
        typeof selectedDoctor.departmentId === "object"
          ? selectedDoctor.departmentId._id || selectedDoctor.departmentId.id
          : selectedDoctor.departmentId;
      if (docDeptId && !selectedDeptId) {
        setSelectedDeptId(docDeptId);
      }
    }
  }, [selectedDoctor, selectedDeptId]);

  // 4. Slots query (requires doctorId and date) - strictly query upcoming slots based on current time
  const slotParams = useMemo(() => {
    if (!selectedDoctorId || !selectedDate) return null;
    return {
      doctorId: selectedDoctorId,
      date: selectedDate,
      onlyFuture: true,
      limit: 100,
    };
  }, [selectedDoctorId, selectedDate]);

  const {
    data: slotsData,
    isLoading: loadingSlots,
    refetch: refetchSlots,
    isFetching: isFetchingSlots,
  } = useSlots(slotParams || {}, {
    enabled: Boolean(slotParams),
  });

  const slots = useMemo(() => {
    if (!slotParams) return [];
    return (
      slotsData?.data?.items ||
      slotsData?.data?.slots ||
      (Array.isArray(slotsData?.data) ? slotsData.data : [])
    );
  }, [slotsData, slotParams]);

  // Strictly filter future slots based on current time
  const futureSlots = useMemo(() => {
    const now = new Date();
    return slots.filter((s) => {
      if (!s.startAt) return false;
      return new Date(s.startAt) > now;
    });
  }, [slots]);

  // Group future slots
  const morningSlots = useMemo(
    () => futureSlots.filter((s) => getSlotPeriod(s.startAt) === "morning"),
    [futureSlots]
  );
  const afternoonSlots = useMemo(
    () => futureSlots.filter((s) => getSlotPeriod(s.startAt) === "afternoon"),
    [futureSlots]
  );
  const eveningSlots = useMemo(
    () => futureSlots.filter((s) => getSlotPeriod(s.startAt) === "evening"),
    [futureSlots]
  );

  // Clear slot if doctor or date changes
  const handleDoctorChange = (docId) => {
    setSelectedDoctorId(docId);
    setSelectedSlot(null);
    setFormErrors((prev) => ({ ...prev, doctorId: null, slotId: null }));
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setFormErrors((prev) => ({ ...prev, appointmentDate: null, slotId: null }));
  };

  const handleDepartmentChange = (deptId) => {
    setSelectedDeptId(deptId);
    // If the currently selected doctor doesn't belong to the new department, reset doctor & slot
    if (selectedDoctor && deptId) {
      const docDeptId =
        typeof selectedDoctor.departmentId === "object"
          ? selectedDoctor.departmentId._id || selectedDoctor.departmentId.id
          : selectedDoctor.departmentId;
      if (docDeptId !== deptId) {
        setSelectedDoctorId("");
        setSelectedSlot(null);
      }
    }
  };

  // Mutations
  const createPatientMutation = useCreatePatient();
  const bookAppointmentMutation = useBookAppointment();

  // Handle Register New Patient
  const handleRegisterPatientSubmit = async (e) => {
    e.preventDefault();
    setNewPatientErrors({});

    const errors = {};
    if (!newPatient.name.trim()) errors.name = "Patient full name is required.";
    if (!newPatient.mobile.trim()) errors.mobile = "Mobile contact is required.";

    if (Object.keys(errors).length > 0) {
      setNewPatientErrors(errors);
      return;
    }

    try {
      const res = await createPatientMutation.mutateAsync({
        name: newPatient.name.trim(),
        mobile: newPatient.mobile.trim(),
        patientId: newPatient.patientId.trim() || undefined,
        gender: newPatient.gender,
        dateOfBirth: newPatient.dateOfBirth || undefined,
        bloodGroup: newPatient.bloodGroup || undefined,
        address: newPatient.address.trim() || undefined,
      });

      const createdPatient = res?.data?.patient || res?.data || res;
      setSelectedPatient(createdPatient);
      setActiveTab("search");
      setPatientSearch("");
      setFormErrors((prev) => ({ ...prev, patientId: null }));
      toast.success(`Patient "${createdPatient.name}" registered and selected!`);
      // Reset new patient form
      setNewPatient({
        name: "",
        mobile: "",
        patientId: "",
        gender: "male",
        dateOfBirth: "",
        bloodGroup: "",
        address: "",
      });
    } catch (err) {
      toast.error(err?.message || "Failed to register new patient");
    }
  };

  // Validation
  const validateForm = () => {
    const errors = {};
    if (!selectedPatient) {
      errors.patientId = "Please select or register a patient.";
    }
    if (!selectedDoctorId) {
      errors.doctorId = "Please select a consulting doctor.";
    }
    if (!selectedDate) {
      errors.appointmentDate = "Please choose an appointment date.";
    }
    if (!selectedSlot) {
      errors.slotId = "Please select an available time slot.";
    }
    if (!purpose.trim()) {
      errors.purpose = "Please specify the purpose of the appointment.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Book Appointment
  const handleBookAppointment = async (e) => {
    e?.preventDefault();
    setServerError(null);

    if (!validateForm()) {
      toast.error("Please complete all required fields.");
      return;
    }

    // Resolve patient ObjectId
    const patientObjectId = selectedPatient?._id || selectedPatient?.id;
    const doctorObjectId = selectedDoctorId;
    const slotObjectId = selectedSlot?._id || selectedSlot?.id;

    // Resolve department ObjectId
    let departmentObjectId = selectedDeptId || null;
    if (!departmentObjectId && selectedDoctor?.departmentId) {
      departmentObjectId =
        typeof selectedDoctor.departmentId === "object"
          ? selectedDoctor.departmentId._id || selectedDoctor.departmentId.id
          : selectedDoctor.departmentId;
    }

    const payload = {
      patientId: patientObjectId,
      doctorId: doctorObjectId,
      slotId: slotObjectId,
      ...(departmentObjectId ? { departmentId: departmentObjectId } : {}),
      purpose: purpose.trim(),
      notes: notes.trim(),
      appointmentDate: selectedSlot.startAt || selectedDate,
    };

    try {
      const res = await bookAppointmentMutation.mutateAsync(payload);
      const appt = res?.data?.appointment || res?.data || res;
      setBookingSuccessData({
        appointment: appt,
        patient: selectedPatient,
        doctor: selectedDoctor,
        slot: selectedSlot,
        date: selectedDate,
        purpose: purpose.trim(),
        notes: notes.trim(),
      });
      toast.success("Appointment booked successfully!");
    } catch (err) {
      const msg = err?.message || "Failed to book appointment. Please try again.";
      setServerError(msg);
      toast.error(msg);
      // Refresh slots in case slot was taken concurrently
      if (selectedDoctorId && selectedDate) {
        refetchSlots();
      }
    }
  };

  const handleResetForm = () => {
    setSelectedPatient(null);
    setSelectedDoctorId("");
    setSelectedDeptId("");
    setSelectedDate(getTodayString());
    setSelectedSlot(null);
    setPurpose("");
    setNotes("");
    setFormErrors({});
    setServerError(null);
    setBookingSuccessData(null);
    setPatientSearch("");
  };

  const handlePrintSlip = () => {
    window.print();
    toast.success("Sending to printer...");
  };

  return (
    <PermissionGate
      permission={PERMISSIONS.APPOINTMENTS_CREATE}
      roles={["super_admin", "admin", "receptionist"]}
    >
      <PageContainer maxWidth="wide" className="space-y-6 pb-12">
        {/* Navigation Breadcrumb */}
        <Breadcrumbs />

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/80 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FiCalendar className="h-4 w-4" />
              </span>
              <h1 className="font-display text-xl sm:text-2xl font-bold text-text">
                Book Patient Appointment
              </h1>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-muted">
              Search or register a patient, select department and physician, and reserve an open consultation slot.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                Cancel
              </Button>
            </Link>
          </div>
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <Alert
            variant="danger"
            title="Booking Failed"
            description={serverError}
            className="animate-fadeIn"
          />
        )}

        {/* Success Modal / State View */}
        {bookingSuccessData ? (
          <div className="rounded-2xl border border-emerald-500/30 bg-surface p-6 sm:p-8 shadow-xl space-y-6 animate-scaleUp text-left max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-border pb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 shadow-sm">
                  <FiCheckCircle className="h-7 w-7" />
                </div>
                <div>
                  <Badge variant="success" size="sm" className="mb-1">
                    Confirmed & Scheduled
                  </Badge>
                  <h2 className="font-display text-xl font-bold text-text">
                    Appointment Booking Confirmed
                  </h2>
                  <p className="text-xs text-muted">
                    Reference ID:{" "}
                    <span className="font-mono font-semibold text-text">
                      {bookingSuccessData.appointment?._id || "NEW-APPT"}
                    </span>
                  </p>
                </div>
              </div>

              <div className="hidden sm:block text-right">
                <span className="text-[11px] uppercase tracking-wider text-muted font-semibold">
                  Desk Attendant
                </span>
                <p className="text-xs font-semibold text-text">{user?.name || "Receptionist"}</p>
              </div>
            </div>

            {/* Slip Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Patient Card */}
              <div className="rounded-xl border border-border bg-slate-50/60 dark:bg-slate-800/40 p-4 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs text-muted font-semibold uppercase">
                  <FiUser className="text-primary h-3.5 w-3.5" />
                  <span>Patient Record</span>
                </div>
                <h4 className="font-bold text-text text-base">
                  {bookingSuccessData.patient?.name}
                </h4>
                <div className="text-xs text-muted space-y-0.5">
                  <p className="font-mono">
                    Patient ID: {bookingSuccessData.patient?.patientId || "Auto-Assigned"}
                  </p>
                  <p>Mobile: {bookingSuccessData.patient?.mobile || "N/A"}</p>
                  <p className="capitalize">
                    Gender: {bookingSuccessData.patient?.gender || "Unspecified"}
                  </p>
                </div>
              </div>

              {/* Doctor Card */}
              <div className="rounded-xl border border-border bg-slate-50/60 dark:bg-slate-800/40 p-4 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs text-muted font-semibold uppercase">
                  <FaUserMd className="text-indigo-500 h-3.5 w-3.5" />
                  <span>Consulting Physician</span>
                </div>
                <h4 className="font-bold text-text text-base">
                  Dr.{" "}
                  {(
                    bookingSuccessData.doctor?.userId?.name ||
                    bookingSuccessData.doctor?.name ||
                    "Physician"
                  ).replace(/^Dr\.\s*/i, "")}
                </h4>
                <div className="text-xs text-muted space-y-0.5">
                  <p className="text-primary font-medium">
                    {bookingSuccessData.doctor?.specialization || "Clinical Consultant"}
                  </p>
                  <p>
                    Department:{" "}
                    {bookingSuccessData.doctor?.departmentId?.name ||
                      bookingSuccessData.doctor?.departmentName ||
                      "General Medicine"}
                  </p>
                  <p>Duration: {bookingSuccessData.doctor?.consultationDuration || 15} mins</p>
                </div>
              </div>
            </div>

            {/* Appointment Schedule Time */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 dark:bg-primary/10 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
                  <FiCalendar className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs text-muted font-semibold uppercase">Scheduled Date</span>
                  <p className="text-sm font-bold text-text">
                    {new Date(bookingSuccessData.date).toLocaleDateString(undefined, {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white">
                  <FiClock className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs text-muted font-semibold uppercase">Time Slot</span>
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {formatSlotTime(bookingSuccessData.slot?.startAt)} —{" "}
                    {formatSlotTime(bookingSuccessData.slot?.endAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Purpose & Notes */}
            <div className="rounded-xl border border-border bg-surface p-4 space-y-2 text-xs">
              <div>
                <span className="font-semibold text-muted uppercase tracking-wider text-[11px]">
                  Consultation Purpose:
                </span>
                <p className="font-medium text-text mt-0.5">{bookingSuccessData.purpose}</p>
              </div>
              {bookingSuccessData.notes && (
                <div className="pt-2 border-t border-border/60">
                  <span className="font-semibold text-muted uppercase tracking-wider text-[11px]">
                    Receptionist Notes:
                  </span>
                  <p className="text-muted mt-0.5">{bookingSuccessData.notes}</p>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border">
              <Button
                variant="outline"
                size="md"
                onClick={handlePrintSlip}
                leftIcon={<FiPrinter className="h-4 w-4" />}
              >
                Print Appointment Slip
              </Button>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={handleResetForm}
                  className="flex-1 sm:flex-initial"
                >
                  Book Another Patient
                </Button>

                <Link href="/dashboard" className="flex-1 sm:flex-initial">
                  <Button variant="primary" size="md" className="w-full">
                    Go to Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* Main 2-Column Booking Interface */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 8 Columns: Sequential Booking Form */}
            <div className="lg:col-span-8 space-y-6">
              {/* Step 1: Patient Selection Card */}
              <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-border/80 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white font-bold text-xs">
                      1
                    </span>
                    <div>
                      <h3 className="font-display text-base font-bold text-text">
                        Patient Selection
                      </h3>
                      <p className="text-xs text-muted">
                        Search by name, patient ID, or mobile number, or register a new patient.
                      </p>
                    </div>
                  </div>

                  {/* Mode Toggle Pills */}
                  <div className="flex items-center rounded-lg bg-slate-100 dark:bg-slate-800/80 p-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setActiveTab("search")}
                      className={cn(
                        "flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-all",
                        activeTab === "search"
                          ? "bg-surface text-primary shadow-sm font-semibold"
                          : "text-muted hover:text-text"
                      )}
                    >
                      <FiSearch className="h-3.5 w-3.5" />
                      <span>Search Existing</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("register")}
                      className={cn(
                        "flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-all",
                        activeTab === "register"
                          ? "bg-surface text-primary shadow-sm font-semibold"
                          : "text-muted hover:text-text"
                      )}
                    >
                      <FiUserPlus className="h-3.5 w-3.5" />
                      <span>+ Register New</span>
                    </button>
                  </div>
                </div>

                {/* Sub-view: Search Tab */}
                {activeTab === "search" && (
                  <div className="space-y-4">
                    {selectedPatient ? (
                      /* Selected Patient Banner */
                      <div className="rounded-xl border border-emerald-500/40 bg-emerald-50/40 dark:bg-emerald-950/20 p-4 transition-all">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex items-center gap-3.5">
                            <Avatar
                              name={selectedPatient.name}
                              size="md"
                              className="ring-2 ring-emerald-500/30"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-display text-base font-bold text-text">
                                  {selectedPatient.name}
                                </h4>
                                <Badge
                                  variant="outline"
                                  size="sm"
                                  className="font-mono text-[10px] font-bold"
                                >
                                  {selectedPatient.patientId || "ID"}
                                </Badge>
                                <StatusBadge
                                  status={selectedPatient.status || "active"}
                                  size="sm"
                                />
                              </div>
                              <div className="mt-1 flex items-center gap-3 text-xs text-muted">
                                <span className="flex items-center gap-1">
                                  <FiPhone className="h-3 w-3 text-primary" />
                                  {selectedPatient.mobile || "No mobile"}
                                </span>
                                <span>•</span>
                                <span className="capitalize">
                                  {selectedPatient.gender || "Unspecified"}
                                </span>
                                {selectedPatient.dateOfBirth && (
                                  <>
                                    <span>•</span>
                                    <span>
                                      DOB:{" "}
                                      {new Date(
                                        selectedPatient.dateOfBirth
                                      ).toLocaleDateString()}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedPatient(null);
                              setPatientSearch("");
                            }}
                            leftIcon={<FiX className="h-3.5 w-3.5" />}
                          >
                            Change Patient
                          </Button>
                        </div>
                      </div>
                    ) : (
                      /* Search Input & Live Results */
                      <div className="space-y-3">
                        <div className="relative">
                          <FiSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                          <input
                            type="text"
                            value={patientSearch}
                            onChange={(e) => setPatientSearch(e.target.value)}
                            placeholder="Type patient name, phone number, or ID (e.g. PT00001)..."
                            className="h-11 w-full rounded-xl border border-border bg-surface pl-10 pr-10 text-sm text-text placeholder:text-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm transition-all"
                          />
                          {patientSearch && (
                            <button
                              type="button"
                              onClick={() => setPatientSearch("")}
                              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full text-muted hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            >
                              <FiX className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>

                        {formErrors.patientId && (
                          <p className="text-xs text-danger font-medium flex items-center gap-1">
                            <FiAlertCircle className="h-3.5 w-3.5" />
                            {formErrors.patientId}
                          </p>
                        )}

                        {/* Search Results List */}
                        {loadingPatients ? (
                          <div className="flex items-center justify-center gap-2 py-6 text-xs text-muted">
                            <Spinner size="sm" />
                            <span>Searching registered patients...</span>
                          </div>
                        ) : patientsList.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted">
                            <p className="font-semibold text-text">No patients found</p>
                            <p className="mt-1">
                              {patientSearch
                                ? `No records match "${patientSearch}". Try another query or register them.`
                                : "Type a name or phone number to find patients."}
                            </p>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="mt-3"
                              onClick={() => setActiveTab("register")}
                              leftIcon={<FiUserPlus />}
                            >
                              Register New Patient
                            </Button>
                          </div>
                        ) : (
                          <div className="divide-y divide-border/60 rounded-xl border border-border bg-surface/50 max-h-56 overflow-y-auto">
                            {patientsList.map((p) => {
                              const pId = p.id || p._id;
                              return (
                                <div
                                  key={pId}
                                  onClick={() => {
                                    setSelectedPatient(p);
                                    setFormErrors((prev) => ({ ...prev, patientId: null }));
                                  }}
                                  className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                                >
                                  <div className="flex items-center gap-3">
                                    <Avatar name={p.name} size="sm" />
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold text-text">
                                          {p.name}
                                        </span>
                                        <Badge
                                          variant="outline"
                                          size="sm"
                                          className="font-mono text-[10px] py-0 px-1"
                                        >
                                          {p.patientId}
                                        </Badge>
                                      </div>
                                      <div className="flex items-center gap-2 text-[11px] text-muted mt-0.5">
                                        <span>{p.mobile}</span>
                                        <span>•</span>
                                        <span className="capitalize">{p.gender || "Patient"}</span>
                                      </div>
                                    </div>
                                  </div>

                                  <Button variant="ghost" size="xs" className="text-primary font-semibold">
                                    Select
                                  </Button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Sub-view: Register New Patient Form */}
                {activeTab === "register" && (
                  <form onSubmit={handleRegisterPatientSubmit} className="space-y-4 pt-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-primary">
                        Quick Patient Registration
                      </h4>
                      <button
                        type="button"
                        onClick={() => setActiveTab("search")}
                        className="text-xs text-muted hover:text-text underline"
                      >
                        Back to search
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Full Name"
                        placeholder="e.g. Eleanor Vance"
                        value={newPatient.name}
                        onChange={(e) =>
                          setNewPatient({ ...newPatient, name: e.target.value })
                        }
                        error={newPatientErrors.name}
                        required
                      />

                      <Input
                        label="Mobile Phone"
                        placeholder="e.g. +1 555-0123"
                        value={newPatient.mobile}
                        onChange={(e) =>
                          setNewPatient({ ...newPatient, mobile: e.target.value })
                        }
                        error={newPatientErrors.mobile}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Select
                        label="Gender"
                        value={newPatient.gender}
                        onChange={(e) =>
                          setNewPatient({ ...newPatient, gender: e.target.value })
                        }
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </Select>

                      <Input
                        label="Date of Birth"
                        type="date"
                        value={newPatient.dateOfBirth}
                        onChange={(e) =>
                          setNewPatient({ ...newPatient, dateOfBirth: e.target.value })
                        }
                      />

                      <Select
                        label="Blood Group (Optional)"
                        value={newPatient.bloodGroup}
                        onChange={(e) =>
                          setNewPatient({ ...newPatient, bloodGroup: e.target.value })
                        }
                      >
                        <option value="">Unknown</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </Select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Custom Patient ID (Optional)"
                        placeholder="Auto-generated if left blank"
                        value={newPatient.patientId}
                        onChange={(e) =>
                          setNewPatient({ ...newPatient, patientId: e.target.value })
                        }
                      />

                      <Input
                        label="Residential Address (Optional)"
                        placeholder="City, State, Zip"
                        value={newPatient.address}
                        onChange={(e) =>
                          setNewPatient({ ...newPatient, address: e.target.value })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveTab("search")}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        loading={createPatientMutation.isPending}
                        leftIcon={<FiUserPlus />}
                      >
                        Register & Select
                      </Button>
                    </div>
                  </form>
                )}
              </div>

              {/* Step 2: Department & Doctor Selection */}
              <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-3 border-b border-border/80 pb-4">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white font-bold text-xs">
                    2
                  </span>
                  <div>
                    <h3 className="font-display text-base font-bold text-text">
                      Department & Physician Selection
                    </h3>
                    <p className="text-xs text-muted">
                      Filter doctors by clinical department and choose a practitioner.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Department Select */}
                  <div>
                    <Select
                      label="Clinical Department (Optional Filter)"
                      value={selectedDeptId}
                      onChange={(e) => handleDepartmentChange(e.target.value)}
                      disabled={loadingDepartments}
                    >
                      <option value="">All Clinical Departments</option>
                      {departments.map((dept) => {
                        const id = dept.id || dept._id;
                        return (
                          <option key={id} value={id}>
                            {dept.name}
                          </option>
                        );
                      })}
                    </Select>
                  </div>

                  {/* Doctor Select */}
                  <div>
                    <Select
                      label="Consulting Doctor *"
                      value={selectedDoctorId}
                      onChange={(e) => handleDoctorChange(e.target.value)}
                      disabled={loadingDoctors}
                      error={formErrors.doctorId}
                      required
                    >
                      <option value="" disabled>
                        {loadingDoctors ? "Loading active doctors..." : "Select consulting doctor..."}
                      </option>
                      {doctors.map((doc) => {
                        const id = doc.id || doc._id;
                        const name = doc.userId?.name || doc.name || "Doctor";
                        const spec = doc.specialization ? ` (${doc.specialization})` : "";
                        return (
                          <option key={id} value={id}>
                            Dr. {name.replace(/^Dr\.\s*/i, "")}{spec}
                          </option>
                        );
                      })}
                    </Select>
                  </div>
                </div>

                {/* Selected Doctor Highlight Info Card */}
                {selectedDoctor && (
                  <div className="rounded-xl border border-border bg-slate-50/70 dark:bg-slate-800/40 p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={selectedDoctor.userId?.name || selectedDoctor.name}
                        size="sm"
                        className="ring-2 ring-primary/20"
                      />
                      <div>
                        <h5 className="font-bold text-text">
                          Dr.{" "}
                          {(
                            selectedDoctor.userId?.name ||
                            selectedDoctor.name ||
                            "Physician"
                          ).replace(/^Dr\.\s*/i, "")}
                        </h5>
                        <p className="text-primary font-medium">
                          {selectedDoctor.specialization || "Clinical Consultant"} •{" "}
                          {selectedDoctor.departmentId?.name ||
                            selectedDoctor.departmentName ||
                            "General Department"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-muted">
                      <FiClock className="h-3.5 w-3.5 text-primary" />
                      <span>{selectedDoctor.consultationDuration || 15} minutes slot duration</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 3: Date & Available Time Slots */}
              <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-border/80 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white font-bold text-xs">
                      3
                    </span>
                    <div>
                      <h3 className="font-display text-base font-bold text-text">
                        Appointment Date & Time Slot
                      </h3>
                      <p className="text-xs text-muted">
                        Select a date to inspect generated time slots for the doctor.
                      </p>
                    </div>
                  </div>

                  {selectedDoctorId && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={() => refetchSlots()}
                      disabled={isFetchingSlots}
                      leftIcon={
                        <FiRefreshCw
                          className={cn("h-3 w-3", isFetchingSlots && "animate-spin")}
                        />
                      }
                    >
                      Refresh Slots
                    </Button>
                  )}
                </div>

                {/* Date Controls & Quick Presets */}
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                    <div>
                      <Input
                        label="Select Appointment Date *"
                        type="date"
                        min={getTodayString()}
                        value={selectedDate}
                        onChange={(e) => handleDateChange(e.target.value)}
                        error={formErrors.appointmentDate}
                        required
                      />
                    </div>

                    <div className="space-y-1.5 pt-1 sm:pt-4">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                        Quick Date Presets
                      </span>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button
                          type="button"
                          variant={selectedDate === getTodayString(0) ? "primary" : "outline"}
                          size="xs"
                          onClick={() => handleDateChange(getTodayString(0))}
                        >
                          Today
                        </Button>
                        <Button
                          type="button"
                          variant={selectedDate === getTodayString(1) ? "primary" : "outline"}
                          size="xs"
                          onClick={() => handleDateChange(getTodayString(1))}
                        >
                          Tomorrow
                        </Button>
                        <Button
                          type="button"
                          variant={selectedDate === getTodayString(2) ? "primary" : "outline"}
                          size="xs"
                          onClick={() => handleDateChange(getTodayString(2))}
                        >
                          +2 Days
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Slots Grid Display */}
                <div className="pt-2">
                  {!selectedDoctorId ? (
                    <div className="rounded-xl border border-dashed border-border p-8 text-center text-xs text-muted space-y-1">
                      <FaUserMd className="mx-auto h-7 w-7 text-muted/60 mb-2" />
                      <p className="font-semibold text-text">Please choose a doctor first</p>
                      <p>Time slots depend on the doctor&apos;s weekly working schedule and duration.</p>
                    </div>
                  ) : loadingSlots ? (
                    <div className="py-12 flex flex-col items-center justify-center space-y-2 text-xs text-muted">
                      <Spinner size="md" />
                      <span>Loading slots for selected doctor...</span>
                    </div>
                  ) : futureSlots.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border p-8 text-center text-xs text-muted space-y-2">
                      <FiClock className="mx-auto h-7 w-7 text-muted/60 mb-1" />
                      <p className="font-semibold text-text">
                        No upcoming time slots available for {selectedDate}
                      </p>
                      <p className="max-w-md mx-auto">
                        {slots.length > 0
                          ? `All consultation slots for today have already passed. Please select tomorrow or an upcoming date to book an appointment.`
                          : `Dr. ${(selectedDoctor?.userId?.name || selectedDoctor?.name || "Doctor").replace(/^Dr\.\s*/i, "")} does not have generated slots for this date, or may not work on this weekday.`}
                      </p>
                      <div className="pt-2 flex items-center justify-center gap-2">
                        {slots.length > 0 ? (
                          <Button
                            variant="primary"
                            size="sm"
                            type="button"
                            onClick={() => handleDateChange(getTodayString(1))}
                          >
                            Check Tomorrow&apos;s Slots
                          </Button>
                        ) : (
                          <Link href="/slots">
                            <Button variant="outline" size="sm">
                              Generate Slots in Slot Manager
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {formErrors.slotId && (
                        <p className="text-xs text-danger font-medium flex items-center gap-1">
                          <FiAlertCircle className="h-3.5 w-3.5" />
                          {formErrors.slotId}
                        </p>
                      )}

                      {/* Morning Session */}
                      {morningSlots.length > 0 && (
                        <div className="space-y-2.5">
                          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
                            <FiSun className="text-amber-500 h-3.5 w-3.5" />
                            <span>Morning Session ({morningSlots.length})</span>
                          </div>
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                            {morningSlots.map((slot) => {
                              const sId = slot.id || slot._id;
                              const isSelected = (selectedSlot?._id || selectedSlot?.id) === sId;
                              const isBooked = slot.status === "booked";

                              return (
                                <button
                                  key={sId}
                                  type="button"
                                  disabled={isBooked}
                                  onClick={() => {
                                    if (!isBooked) {
                                      setSelectedSlot(slot);
                                      setFormErrors((prev) => ({ ...prev, slotId: null }));
                                    }
                                  }}
                                  className={cn(
                                    "relative flex flex-col items-center justify-center rounded-xl border p-2.5 text-xs transition-all duration-150 cursor-pointer select-none",
                                    "disabled:cursor-not-allowed disabled:opacity-40 disabled:bg-slate-100 dark:disabled:bg-slate-800/40",
                                    isSelected
                                      ? "border-primary bg-primary text-white shadow-md font-bold scale-[1.02]"
                                      : isBooked
                                      ? "border-border bg-slate-50 dark:bg-slate-800/40 text-muted line-through"
                                      : "border-border bg-surface text-text hover:border-primary/60 hover:bg-primary/5 shadow-sm"
                                  )}
                                >
                                  <span className="font-semibold">{formatSlotTime(slot.startAt)}</span>
                                  <span className="text-[10px] opacity-80 mt-0.5">
                                    {isBooked ? "Booked" : "Open"}
                                  </span>
                                  {isSelected && (
                                    <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
                                      <FiCheck className="h-2.5 w-2.5 stroke-[3]" />
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Afternoon Session */}
                      {afternoonSlots.length > 0 && (
                        <div className="space-y-2.5">
                          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
                            <FiSunset className="text-orange-500 h-3.5 w-3.5" />
                            <span>Afternoon Session ({afternoonSlots.length})</span>
                          </div>
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                            {afternoonSlots.map((slot) => {
                              const sId = slot.id || slot._id;
                              const isSelected = (selectedSlot?._id || selectedSlot?.id) === sId;
                              const isBooked = slot.status === "booked";

                              return (
                                <button
                                  key={sId}
                                  type="button"
                                  disabled={isBooked}
                                  onClick={() => {
                                    if (!isBooked) {
                                      setSelectedSlot(slot);
                                      setFormErrors((prev) => ({ ...prev, slotId: null }));
                                    }
                                  }}
                                  className={cn(
                                    "relative flex flex-col items-center justify-center rounded-xl border p-2.5 text-xs transition-all duration-150 cursor-pointer select-none",
                                    "disabled:cursor-not-allowed disabled:opacity-40 disabled:bg-slate-100 dark:disabled:bg-slate-800/40",
                                    isSelected
                                      ? "border-primary bg-primary text-white shadow-md font-bold scale-[1.02]"
                                      : isBooked
                                      ? "border-border bg-slate-50 dark:bg-slate-800/40 text-muted line-through"
                                      : "border-border bg-surface text-text hover:border-primary/60 hover:bg-primary/5 shadow-sm"
                                  )}
                                >
                                  <span className="font-semibold">{formatSlotTime(slot.startAt)}</span>
                                  <span className="text-[10px] opacity-80 mt-0.5">
                                    {isBooked ? "Booked" : "Open"}
                                  </span>
                                  {isSelected && (
                                    <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
                                      <FiCheck className="h-2.5 w-2.5 stroke-[3]" />
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Evening Session */}
                      {eveningSlots.length > 0 && (
                        <div className="space-y-2.5">
                          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
                            <FiMoon className="text-indigo-400 h-3.5 w-3.5" />
                            <span>Evening Session ({eveningSlots.length})</span>
                          </div>
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                            {eveningSlots.map((slot) => {
                              const sId = slot.id || slot._id;
                              const isSelected = (selectedSlot?._id || selectedSlot?.id) === sId;
                              const isBooked = slot.status === "booked";

                              return (
                                <button
                                  key={sId}
                                  type="button"
                                  disabled={isBooked}
                                  onClick={() => {
                                    if (!isBooked) {
                                      setSelectedSlot(slot);
                                      setFormErrors((prev) => ({ ...prev, slotId: null }));
                                    }
                                  }}
                                  className={cn(
                                    "relative flex flex-col items-center justify-center rounded-xl border p-2.5 text-xs transition-all duration-150 cursor-pointer select-none",
                                    "disabled:cursor-not-allowed disabled:opacity-40 disabled:bg-slate-100 dark:disabled:bg-slate-800/40",
                                    isSelected
                                      ? "border-primary bg-primary text-white shadow-md font-bold scale-[1.02]"
                                      : isBooked
                                      ? "border-border bg-slate-50 dark:bg-slate-800/40 text-muted line-through"
                                      : "border-border bg-surface text-text hover:border-primary/60 hover:bg-primary/5 shadow-sm"
                                  )}
                                >
                                  <span className="font-semibold">{formatSlotTime(slot.startAt)}</span>
                                  <span className="text-[10px] opacity-80 mt-0.5">
                                    {isBooked ? "Booked" : "Open"}
                                  </span>
                                  {isSelected && (
                                    <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
                                      <FiCheck className="h-2.5 w-2.5 stroke-[3]" />
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Step 4: Appointment Purpose & Clinical Notes */}
              <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-3 border-b border-border/80 pb-4">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white font-bold text-xs">
                    4
                  </span>
                  <div>
                    <h3 className="font-display text-base font-bold text-text">
                      Consultation Purpose & Notes
                    </h3>
                    <p className="text-xs text-muted">
                      State the primary complaint or reason for visit and any reception notes.
                    </p>
                  </div>
                </div>

                {/* Quick Purpose Chips */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                    Quick Purpose Suggestions
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {[
                      "Routine Health Checkup",
                      "Follow-up Consultation",
                      "Chest Pain / Cardiology Evaluation",
                      "Fever & Acute Symptoms",
                      "Lab Reports & Diagnosis Review",
                      "Prescription Renewal",
                    ].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => {
                          setPurpose(chip);
                          setFormErrors((prev) => ({ ...prev, purpose: null }));
                        }}
                        className={cn(
                          "rounded-lg border px-2.5 py-1 text-xs transition-colors",
                          purpose === chip
                            ? "border-primary bg-primary/10 text-primary font-semibold"
                            : "border-border bg-surface text-muted hover:text-text hover:bg-slate-50 dark:hover:bg-slate-800"
                        )}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Purpose Input */}
                <div>
                  <Input
                    label="Appointment Purpose *"
                    placeholder="e.g. Regular medical follow up or symptom description"
                    value={purpose}
                    onChange={(e) => {
                      setPurpose(e.target.value);
                      setFormErrors((prev) => ({ ...prev, purpose: null }));
                    }}
                    error={formErrors.purpose}
                    required
                  />
                </div>

                {/* Additional Reception Notes */}
                <div>
                  <label className="block text-xs font-semibold text-text mb-1">
                    Special Notes / Instructions (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Any patient special needs, wheelchair assistance, or insurance details..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full rounded-xl border border-border bg-surface p-3 text-xs text-text placeholder:text-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm"
                  />
                </div>
              </div>
            </div>

            {/* Right 4 Columns: Sticky Live Appointment Slip & Confirm */}
            <div className="lg:col-span-4 sticky top-6 space-y-4">
              <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-md space-y-5">
                <div className="flex items-center justify-between border-b border-border/80 pb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                      Summary
                    </span>
                    <h3 className="font-display text-base font-bold text-text">
                      Booking Overview
                    </h3>
                  </div>
                  <Badge variant={selectedSlot ? "success" : "warning"} size="sm">
                    {selectedSlot ? "Ready to Confirm" : "In Progress"}
                  </Badge>
                </div>

                {/* Summary Entities */}
                <div className="space-y-3 text-xs">
                  {/* Patient */}
                  <div className="rounded-xl border border-border/70 bg-slate-50/60 dark:bg-slate-800/40 p-3 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-muted flex items-center gap-1">
                      <FiUser className="text-primary h-3 w-3" />
                      <span>Patient</span>
                    </span>
                    {selectedPatient ? (
                      <div>
                        <p className="font-bold text-text text-sm">{selectedPatient.name}</p>
                        <p className="text-muted font-mono text-[11px]">
                          ID: {selectedPatient.patientId || "Assigned"} • {selectedPatient.mobile}
                        </p>
                      </div>
                    ) : (
                      <p className="text-muted italic">No patient selected</p>
                    )}
                  </div>

                  {/* Doctor & Dept */}
                  <div className="rounded-xl border border-border/70 bg-slate-50/60 dark:bg-slate-800/40 p-3 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-muted flex items-center gap-1">
                      <FaUserMd className="text-indigo-500 h-3 w-3" />
                      <span>Physician & Department</span>
                    </span>
                    {selectedDoctor ? (
                      <div>
                        <p className="font-bold text-text text-sm">
                          Dr.{" "}
                          {(selectedDoctor.userId?.name || selectedDoctor.name).replace(
                            /^Dr\.\s*/i,
                            ""
                          )}
                        </p>
                        <p className="text-primary font-medium text-[11px]">
                          {selectedDoctor.specialization || "Clinical Consultant"}
                        </p>
                        <p className="text-muted text-[11px]">
                          {selectedDoctor.departmentId?.name ||
                            selectedDoctor.departmentName ||
                            "General OPD"}
                        </p>
                      </div>
                    ) : (
                      <p className="text-muted italic">No doctor selected</p>
                    )}
                  </div>

                  {/* Date & Time */}
                  <div className="rounded-xl border border-border/70 bg-slate-50/60 dark:bg-slate-800/40 p-3 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-muted flex items-center gap-1">
                      <FiCalendar className="text-emerald-500 h-3 w-3" />
                      <span>Date & Time Slot</span>
                    </span>
                    <div>
                      <p className="font-bold text-text">
                        {new Date(selectedDate).toLocaleDateString(undefined, {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      {selectedSlot ? (
                        <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 text-sm">
                          {formatSlotTime(selectedSlot.startAt)} —{" "}
                          {formatSlotTime(selectedSlot.endAt)}
                        </p>
                      ) : (
                        <p className="text-muted italic">No time slot chosen</p>
                      )}
                    </div>
                  </div>

                  {/* Purpose */}
                  {purpose && (
                    <div className="rounded-xl border border-border/70 bg-slate-50/60 dark:bg-slate-800/40 p-3 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-muted">Purpose</span>
                      <p className="text-text font-medium">{purpose}</p>
                    </div>
                  )}
                </div>

                {/* Validation Checklist Indicators */}
                <div className="rounded-xl border border-border bg-slate-50 dark:bg-slate-800/60 p-3 space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Patient Assigned</span>
                    {selectedPatient ? (
                      <FiCheck className="text-emerald-500 h-3.5 w-3.5 font-bold" />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Physician Selected</span>
                    {selectedDoctorId ? (
                      <FiCheck className="text-emerald-500 h-3.5 w-3.5 font-bold" />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Slot Reserved</span>
                    {selectedSlot ? (
                      <FiCheck className="text-emerald-500 h-3.5 w-3.5 font-bold" />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Purpose Specified</span>
                    {purpose.trim() ? (
                      <FiCheck className="text-emerald-500 h-3.5 w-3.5 font-bold" />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                    )}
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-2 space-y-2">
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    className="w-full justify-center gap-2 shadow-md py-3 text-sm font-bold"
                    onClick={handleBookAppointment}
                    loading={bookAppointmentMutation.isPending}
                    disabled={!selectedPatient || !selectedDoctorId || !selectedSlot}
                  >
                    <FiCheckCircle className="h-4 w-4" />
                    <span>Confirm & Book Appointment</span>
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full justify-center text-xs text-muted hover:text-text"
                    onClick={handleResetForm}
                  >
                    Reset Form
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </PageContainer>
    </PermissionGate>
  );
}
