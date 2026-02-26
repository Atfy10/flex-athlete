import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch, ApiError } from "@/lib/api";
import { ApiResult } from "@/types/api";
import { ProfileViewLayout, ProfileSection } from "@/components/profile/ProfileViewLayout";
import { useToast } from "@/hooks/use-toast";
import { BaseModal } from "@/components/modals/BaseModal";
import { FormInput } from "@/components/modals/FormInput";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, Shield, User, Calendar } from "lucide-react";

interface MyProfileDto {
  id: string;
  userName: string;
  email: string;
  phoneNumber?: string;
  roles?: string[];
  createdAt?: string;
}

export default function MyProfile() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const [profile, setProfile] = useState<MyProfileDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Password change modal state
  const [pwOpen, setPwOpen] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwErrors, setPwErrors] = useState<string[]>([]);
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

  // Auto-open from URL tab
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "password") setPwOpen(true);
  }, [searchParams]);

  // Decode basic info from JWT as fallback
  const decodeJwtPayload = (t: string): Record<string, unknown> => {
    try {
      return JSON.parse(atob(t.split(".")[1]));
    } catch {
      return {};
    }
  };

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<ApiResult<MyProfileDto>>("/api/user/me");
      if (res.isSuccess && res.data) {
        setProfile(res.data);
        return;
      }
    } catch {
      // Fallback: decode JWT
    }

    // Fallback: parse JWT for basic info
    if (token) {
      const payload = decodeJwtPayload(token) as {
        sub?: string;
        email?: string;
        unique_name?: string;
        name?: string;
        phone_number?: string;
        role?: string | string[];
      };
      setProfile({
        id: payload.sub ?? "",
        userName: payload.unique_name ?? payload.name ?? "User",
        email: payload.email ?? "",
        phoneNumber: payload.phone_number ?? undefined,
        roles: Array.isArray(payload.role)
          ? payload.role
          : payload.role
          ? [payload.role]
          : undefined,
      });
    } else {
      setError("Could not load profile.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, [token]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwErrors([]);
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwErrors(["New password and confirm password do not match."]);
      return;
    }
    if (pwForm.newPassword.length < 6) {
      setPwErrors(["Password must be at least 6 characters."]);
      return;
    }
    setPwLoading(true);
    try {
      await apiFetch("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword: pwForm.currentPassword,
          newPassword: pwForm.newPassword,
        }),
      });
      toast({ title: "Password changed successfully." });
      setPwOpen(false);
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setPwErrors([err instanceof ApiError ? err.message : "Failed to change password."]);
    } finally {
      setPwLoading(false);
    }
  };

  const sections: ProfileSection[] = profile
    ? [
        {
          title: "Account Information",
          fields: [
            { label: "Username", value: profile.userName, icon: <User className="h-3.5 w-3.5" /> },
            { label: "Email", value: profile.email, icon: <Mail className="h-3.5 w-3.5" /> },
            profile.phoneNumber
              ? { label: "Phone", value: profile.phoneNumber, icon: <Phone className="h-3.5 w-3.5" /> }
              : null,
            profile.createdAt
              ? {
                  label: "Member Since",
                  value: new Date(profile.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }),
                  icon: <Calendar className="h-3.5 w-3.5" />,
                }
              : null,
          ].filter(Boolean) as ProfileSection["fields"],
        },
        ...(profile.roles && profile.roles.length > 0
          ? [
              {
                title: "Assigned Roles",
                fields: [
                  {
                    label: "Roles",
                    value: (
                      <div className="flex flex-wrap gap-1 justify-end">
                        {profile.roles.map((role, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            <Shield className="h-3 w-3 mr-1" />
                            {role}
                          </Badge>
                        ))}
                      </div>
                    ),
                    icon: <Shield className="h-3.5 w-3.5" />,
                  },
                ],
              },
            ]
          : []),
      ]
    : [];

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  return (
    <>
      <ProfileViewLayout
        loading={loading}
        error={error}
        fullName={profile?.userName ?? "My Profile"}
        roleBadge="Admin User"
        roleBadgeVariant="secondary"
        statusBadge="Active"
        statusBadgeClass="bg-success/10 text-success"
        sections={sections}
        backPath="/"
        onEdit={() => setPwOpen(true)}
        toggleLabel="Change Password"
        editModal={null}
        extraActions={undefined}
      />

      {/* Change Password Modal */}
      <BaseModal
        open={pwOpen}
        onOpenChange={setPwOpen}
        title="Change Password"
        description="Enter your current password and choose a new one."
        onSubmit={handlePasswordChange}
        loading={pwLoading}
        submitLabel="Change Password"
        errors={pwErrors}
      >
        <FormInput
          id="currentPassword"
          label="Current Password"
          type="password"
          value={pwForm.currentPassword}
          onChange={(v) => setPwForm((p) => ({ ...p, currentPassword: v }))}
          required
        />
        <FormInput
          id="newPassword"
          label="New Password"
          type="password"
          value={pwForm.newPassword}
          onChange={(v) => setPwForm((p) => ({ ...p, newPassword: v }))}
          required
        />
        <FormInput
          id="confirmPassword"
          label="Confirm New Password"
          type="password"
          value={pwForm.confirmPassword}
          onChange={(v) => setPwForm((p) => ({ ...p, confirmPassword: v }))}
          required
        />
      </BaseModal>
    </>
  );
}
