import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  ClipboardCheck,
  Search,
} from "lucide-react";

interface SessionOccurrence {
  id: number;
  groupName: string;
  sport: string;
  coach: string;
  branch: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "Scheduled" | "Completed" | "Cancelled";
  expectedTrainees: number;
  attendedTrainees: number | null;
}

const mockOccurrences: SessionOccurrence[] = [
  { id: 1, groupName: "Basketball Juniors A", sport: "Basketball", coach: "Mike Johnson", branch: "Downtown", date: "2026-02-16", startTime: "09:00", endTime: "11:00", status: "Scheduled", expectedTrainees: 18, attendedTrainees: null },
  { id: 2, groupName: "Swimming Advanced", sport: "Swimming", coach: "Sarah Davis", branch: "North Side", date: "2026-02-16", startTime: "10:30", endTime: "12:00", status: "Scheduled", expectedTrainees: 12, attendedTrainees: null },
  { id: 3, groupName: "Soccer Youth B", sport: "Soccer", coach: "Emma Wilson", branch: "Downtown", date: "2026-02-16", startTime: "16:00", endTime: "18:00", status: "Scheduled", expectedTrainees: 22, attendedTrainees: null },
  { id: 4, groupName: "Basketball Juniors A", sport: "Basketball", coach: "Mike Johnson", branch: "Downtown", date: "2026-02-15", startTime: "09:00", endTime: "11:00", status: "Completed", expectedTrainees: 18, attendedTrainees: 16 },
  { id: 5, groupName: "Volleyball Mixed", sport: "Volleyball", coach: "Alex Thompson", branch: "North Side", date: "2026-02-15", startTime: "15:00", endTime: "17:00", status: "Completed", expectedTrainees: 14, attendedTrainees: 13 },
  { id: 6, groupName: "Tennis Elite", sport: "Tennis", coach: "Carlos Rodriguez", branch: "East Branch", date: "2026-02-14", startTime: "14:00", endTime: "15:30", status: "Cancelled", expectedTrainees: 8, attendedTrainees: null },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "Scheduled": return "bg-primary/10 text-primary hover:bg-primary/20";
    case "Completed": return "bg-success/10 text-success hover:bg-success/20";
    case "Cancelled": return "bg-destructive/10 text-destructive hover:bg-destructive/20";
    default: return "bg-muted";
  }
};

export default function SessionOccurrences() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("2026-02-16");

  const filtered = mockOccurrences.filter((o) => {
    const matchesSearch =
      o.groupName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.sport.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.coach.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = !dateFilter || o.date === dateFilter;
    return matchesSearch && matchesDate;
  });

  return (
    <div className="space-y-8">
      {/* Header — no create button */}
      <div>
        <h1 className="text-3xl font-bold text-gradient">Session Occurrences</h1>
        <p className="text-muted-foreground">
          System-generated training sessions — read-only view
        </p>
      </div>

      {/* Filters */}
      <Card className="card-athletic">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by group, sport, or coach..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-auto"
            />
          </div>
        </CardContent>
      </Card>

      {/* Occurrences list */}
      <div className="space-y-4">
        {filtered.length === 0 && (
          <Card className="card-athletic">
            <CardContent className="p-12 text-center text-muted-foreground">
              No occurrences found for the selected filters.
            </CardContent>
          </Card>
        )}
        {filtered.map((occ) => (
          <Card key={occ.id} className="card-athletic">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-lg">{occ.groupName}</h3>
                    <Badge variant="outline">{occ.sport}</Badge>
                    <Badge className={getStatusColor(occ.status)}>{occ.status}</Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(occ.date).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {occ.startTime} – {occ.endTime}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      Coach: {occ.coach}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {occ.branch}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {occ.status === "Completed" && occ.attendedTrainees !== null && (
                    <span className="text-sm font-medium text-success">
                      {occ.attendedTrainees}/{occ.expectedTrainees} attended
                    </span>
                  )}
                  {occ.status === "Scheduled" && (
                    <Button variant="outline" size="sm">
                      <ClipboardCheck className="h-4 w-4 mr-1" />
                      Open Attendance
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
