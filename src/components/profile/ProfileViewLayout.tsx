import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, MoreHorizontal, Pencil, Trash2, ToggleLeft } from "lucide-react";

export interface ProfileField {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
}

export interface ProfileSection {
  title: string;
  fields: ProfileField[];
}

export interface ProfileViewLayoutProps {
  loading?: boolean;
  error?: string | null;
  fullName: string;
  roleBadge: string;
  roleBadgeVariant?: "default" | "secondary" | "outline" | "destructive";
  statusBadge: string;
  statusBadgeClass: string;
  sections: ProfileSection[];
  backPath: string;
  onEdit?: () => void;
  onDelete?: () => Promise<void>;
  onToggleActive?: () => Promise<void>;
  toggleLabel?: string;
  editModal?: ReactNode;
  extraActions?: ReactNode;
  dropdownExtra?: { label: string; icon?: ReactNode; onClick: () => void }[];
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-5">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-7 w-48" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            </div>
          </div>
          <Skeleton className="h-9 w-9 rounded-md" />
        </div>
      </div>
      {/* Sections skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
            <Skeleton className="h-5 w-32" />
            {[1, 2, 3].map((j) => (
              <div key={j} className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-36" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProfileViewLayout({
  loading,
  error,
  fullName,
  roleBadge,
  roleBadgeVariant = "secondary",
  statusBadge,
  statusBadgeClass,
  sections,
  backPath,
  onEdit,
  onDelete,
  onToggleActive,
  toggleLabel = "Toggle Active",
  editModal,
  extraActions,
  dropdownExtra = [],
}: ProfileViewLayoutProps) {
  const navigate = useNavigate();

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  if (loading) return <ProfileSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="text-center space-y-2">
          <p className="text-lg font-medium text-destructive">Failed to load profile</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
        <Button variant="outline" onClick={() => navigate(backPath)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to list
        </Button>
      </div>
    );
  }

  const visibleSections = sections.filter(
    (s) => s.fields.filter((f) => f.value !== null && f.value !== undefined && f.value !== "").length > 0
  );

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(backPath)}
        className="text-muted-foreground hover:text-foreground -ml-1 gap-1.5"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      {/* ── Profile Header Card ── */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        {/* Top accent bar */}
        <div className="h-1.5 bg-gradient-primary w-full" />
        <div className="p-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            {/* Left: Avatar + Name */}
            <div className="flex items-center gap-5">
              <Avatar className="h-20 w-20 ring-4 ring-primary/10">
                <AvatarFallback className="bg-gradient-primary text-primary-foreground text-2xl font-bold">
                  {getInitials(fullName)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-foreground leading-none">
                  {fullName}
                </h1>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant={roleBadgeVariant}
                    className="rounded-full font-medium px-3 py-0.5"
                  >
                    {roleBadge}
                  </Badge>
                  <Badge
                    className={`rounded-full font-medium px-3 py-0.5 border-0 ${statusBadgeClass}`}
                  >
                    {statusBadge}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Right: 3-dot menu */}
            <div className="flex items-center gap-2">
              {extraActions}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                    Actions
                  </DropdownMenuLabel>
                  {onEdit && (
                    <DropdownMenuItem onClick={onEdit} className="gap-2 cursor-pointer">
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {dropdownExtra.map((item) => (
                    <DropdownMenuItem key={item.label} onClick={item.onClick} className="gap-2 cursor-pointer">
                      {item.icon}
                      {item.label}
                    </DropdownMenuItem>
                  ))}
                  {onToggleActive && (
                    <DropdownMenuItem
                      onClick={onToggleActive}
                      className="gap-2 cursor-pointer"
                    >
                      <ToggleLeft className="h-3.5 w-3.5" />
                      {toggleLabel}
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem
                            onSelect={(e) => e.preventDefault()}
                            className="gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete {roleBadge}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete <strong>{fullName}</strong>. This action
                              cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={onDelete}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* ── Info Sections Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {visibleSections.map((section) => {
          const visibleFields = section.fields.filter(
            (f) => f.value !== null && f.value !== undefined && f.value !== ""
          );
          if (visibleFields.length === 0) return null;

          return (
            <Card key={section.title} className="border-border shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-3 pt-5 px-6">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-5">
                <dl className="space-y-3.5">
                  {visibleFields.map((field) => (
                    <div
                      key={field.label}
                      className="flex items-start justify-between gap-4 py-1 border-b border-border/50 last:border-0"
                    >
                      <dt className="flex items-center gap-2 text-sm text-muted-foreground shrink-0 min-w-[120px]">
                        {field.icon && (
                          <span className="text-muted-foreground/60">{field.icon}</span>
                        )}
                        {field.label}
                      </dt>
                      <dd className="text-sm font-medium text-foreground text-right">
                        {field.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Injected edit modal */}
      {editModal}
    </div>
  );
}
