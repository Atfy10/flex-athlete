import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Users, Calendar, Play, MoreHorizontal, Clock, MapPin, Trophy, Eye } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { TraineeGroupFormModal } from "@/components/modals/TraineeGroupFormModal";
import { GenerateSessionsModal } from "@/components/modals/GenerateSessionsModal";
import { useClientPagination } from "@/hooks/useClientPagination";
import { BasePagination } from "@/components/BasePagination";

interface GroupSchedule { id: number; dayOfWeek: string; startTime: string; endTime: string; }
interface TraineeGroup { id: number; name: string; sport: string; coach: string; branch: string; level: string; capacity: number; enrolledCount: number; status: "Active" | "Inactive" | "Full"; schedules: GroupSchedule[]; }

const mockGroups: TraineeGroup[] = [
  { id: 1, name: "Basketball Juniors A", sport: "Basketball", coach: "Mike Johnson", branch: "Downtown", level: "Beginner", capacity: 20, enrolledCount: 18, status: "Active", schedules: [{ id: 1, dayOfWeek: "Monday", startTime: "09:00", endTime: "11:00" }, { id: 2, dayOfWeek: "Wednesday", startTime: "09:00", endTime: "11:00" }] },
  { id: 2, name: "Swimming Advanced", sport: "Swimming", coach: "Sarah Davis", branch: "North Side", level: "Advanced", capacity: 15, enrolledCount: 12, status: "Active", schedules: [{ id: 3, dayOfWeek: "Tuesday", startTime: "10:30", endTime: "12:00" }, { id: 4, dayOfWeek: "Thursday", startTime: "10:30", endTime: "12:00" }] },
  { id: 3, name: "Tennis Elite", sport: "Tennis", coach: "Carlos Rodriguez", branch: "East Branch", level: "Advanced", capacity: 8, enrolledCount: 8, status: "Full", schedules: [{ id: 5, dayOfWeek: "Monday", startTime: "14:00", endTime: "15:30" }, { id: 6, dayOfWeek: "Friday", startTime: "14:00", endTime: "15:30" }] },
  { id: 4, name: "Soccer Youth B", sport: "Soccer", coach: "Emma Wilson", branch: "Downtown", level: "Intermediate", capacity: 25, enrolledCount: 22, status: "Active", schedules: [{ id: 7, dayOfWeek: "Wednesday", startTime: "16:00", endTime: "18:00" }, { id: 8, dayOfWeek: "Saturday", startTime: "10:00", endTime: "12:00" }] },
  { id: 5, name: "Volleyball Mixed", sport: "Volleyball", coach: "Alex Thompson", branch: "North Side", level: "Mixed", capacity: 16, enrolledCount: 14, status: "Active", schedules: [{ id: 9, dayOfWeek: "Tuesday", startTime: "15:00", endTime: "17:00" }] },
];

const statsData = [
  { title: "Total Groups", value: "12", icon: Users },
  { title: "Active Groups", value: "10", icon: Play },
  { title: "Total Schedules", value: "28", icon: Calendar },
  { title: "Avg Enrollment", value: "82%", icon: Trophy },
];

const getLevelColor = (level: string) => {
  switch (level) { case "Beginner": return "bg-secondary/10 text-secondary hover:bg-secondary/20"; case "Intermediate": return "bg-primary/10 text-primary hover:bg-primary/20"; case "Advanced": return "bg-success/10 text-success hover:bg-success/20"; case "Mixed": return "bg-warning/10 text-warning hover:bg-warning/20"; default: return "bg-muted"; }
};
const getStatusColor = (status: string) => {
  switch (status) { case "Active": return "bg-success/10 text-success hover:bg-success/20"; case "Full": return "bg-warning/10 text-warning hover:bg-warning/20"; case "Inactive": return "bg-muted text-muted-foreground hover:bg-muted/80"; default: return "bg-muted"; }
};

export default function TraineeGroups() {
  const [searchTerm, setSearchTerm] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<TraineeGroup | null>(null);

  const filteredGroups = useMemo(() => mockGroups.filter((g) =>
    g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.sport.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.coach.toLowerCase().includes(searchTerm.toLowerCase())
  ), [searchTerm]);

  const { paginatedData: groups, page, setPage, pageSize, setPageSize, totalPages, totalCount } = useClientPagination({ data: filteredGroups, initialPageSize: 10 });

  const handleGenerate = (group: TraineeGroup) => {
    setSelectedGroup(group);
    setGenerateOpen(true);
  };

  const handleRefresh = () => {};

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Trainee Groups</h1>
          <p className="text-muted-foreground">Manage training groups and their weekly schedules</p>
        </div>
        <Button variant="hero" size="lg" onClick={() => setCreateOpen(true)}>
          <Plus className="h-5 w-5" />
          Create Group
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsData.map((stat, i) => (
          <Card key={i} className="card-athletic"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-muted-foreground text-sm font-medium">{stat.title}</p><p className="text-2xl font-bold mt-1">{stat.value}</p></div><div className="p-3 rounded-xl bg-primary/10"><stat.icon className="h-5 w-5 text-primary" /></div></div></CardContent></Card>
        ))}
      </div>

      <Card className="card-athletic">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input placeholder="Search groups by name, sport, or coach..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {groups.map((group) => (
          <Card key={group.id} className="card-athletic">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <CardTitle className="text-lg">{group.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-medium">{group.sport}</Badge>
                    <Badge className={getLevelColor(group.level)}>{group.level}</Badge>
                    <Badge className={getStatusColor(group.status)}>{group.status}</Badge>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem>View Details</DropdownMenuItem>
                    <DropdownMenuItem>Edit Group</DropdownMenuItem>
                    <DropdownMenuItem>Manage Schedules</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">Deactivate</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm"><Users className="h-4 w-4 text-muted-foreground" /><span>Coach: {group.coach}</span></div>
                <div className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4 text-muted-foreground" /><span>{group.branch}</span></div>
              </div>
              <div className="space-y-2 pt-3 border-t border-border">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Weekly Schedule</p>
                {group.schedules.map((s) => (
                  <div key={s.id} className="flex items-center gap-2 text-sm bg-muted/50 px-3 py-1.5 rounded-md">
                    <Clock className="h-3 w-3 text-muted-foreground" /><span className="font-medium">{s.dayOfWeek}</span><span className="text-muted-foreground">{s.startTime} – {s.endTime}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-2 pt-3 border-t border-border">
                <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Enrollment</span><span className="font-medium">{group.enrolledCount}/{group.capacity}</span></div>
                <div className="w-full bg-muted rounded-full h-2"><div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${(group.enrolledCount / group.capacity) * 100}%` }} /></div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="default" size="sm" className="flex-1" onClick={() => handleGenerate(group)}>
                  <Play className="h-4 w-4 mr-1" />
                  Generate Sessions
                </Button>
                <Button variant="outline" size="sm" className="flex-1">View Details</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <BasePagination page={page} totalPages={totalPages} pageSize={pageSize} totalCount={totalCount} onPageChange={setPage} onPageSizeChange={setPageSize} />

      <TraineeGroupFormModal open={createOpen} onOpenChange={setCreateOpen} onSuccess={handleRefresh} />
      <GenerateSessionsModal
        open={generateOpen}
        onOpenChange={setGenerateOpen}
        onSuccess={handleRefresh}
        traineeGroupId={selectedGroup?.id}
        groupName={selectedGroup?.name}
        schedules={selectedGroup?.schedules}
      />
    </div>
  );
}
