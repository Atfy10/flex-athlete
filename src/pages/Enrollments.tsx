import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Users, Plus, Search, Filter, Calendar, DollarSign, CheckCircle, Clock, AlertCircle, Eye } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EnrollmentFormModal } from "@/components/modals/EnrollmentFormModal";
import { useClientPagination } from "@/hooks/useClientPagination";
import { BasePagination } from "@/components/BasePagination";

const allEnrollments = [
  { id: 1, trainee: { name: "Alex Thompson", email: "alex.thompson@email.com", avatar: "/api/placeholder/40/40" }, sport: "Basketball", program: "Advanced Training", branch: "Main Campus", coach: "John Smith", enrollmentDate: "2024-01-15", startDate: "2024-01-20", endDate: "2024-06-20", monthlyFee: 120, paymentStatus: "Paid", status: "Active", sessionsCompleted: 12, totalSessions: 24 },
  { id: 2, trainee: { name: "Sarah Wilson", email: "sarah.wilson@email.com", avatar: "/api/placeholder/40/40" }, sport: "Swimming", program: "Competitive Swimming", branch: "Main Campus", coach: "Maria Garcia", enrollmentDate: "2024-02-01", startDate: "2024-02-05", endDate: "2024-08-05", monthlyFee: 150, paymentStatus: "Pending", status: "Active", sessionsCompleted: 8, totalSessions: 20 },
  { id: 3, trainee: { name: "Mike Johnson", email: "mike.johnson@email.com", avatar: "/api/placeholder/40/40" }, sport: "Tennis", program: "Beginner Course", branch: "Downtown", coach: "David Lee", enrollmentDate: "2024-01-10", startDate: "2024-01-15", endDate: "2024-04-15", monthlyFee: 180, paymentStatus: "Overdue", status: "Suspended", sessionsCompleted: 6, totalSessions: 12 },
];

const Enrollments = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const filteredEnrollments = useMemo(() => allEnrollments.filter(e =>
    e.trainee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.sport.toLowerCase().includes(searchTerm.toLowerCase())
  ), [searchTerm]);

  const { paginatedData: enrollments, page, setPage, pageSize, setPageSize, totalPages, totalCount } = useClientPagination({ data: filteredEnrollments, initialPageSize: 10 });

  const getStatusColor = (status: string) => {
    switch (status) { case "Active": return "bg-success text-success-foreground"; case "Pending": return "bg-warning text-warning-foreground"; case "Suspended": return "bg-destructive text-destructive-foreground"; case "Completed": return "bg-muted text-muted-foreground"; default: return "bg-muted text-muted-foreground"; }
  };
  const getPaymentStatusColor = (status: string) => {
    switch (status) { case "Paid": return "bg-success text-success-foreground"; case "Pending": return "bg-warning text-warning-foreground"; case "Overdue": return "bg-destructive text-destructive-foreground"; default: return "bg-muted text-muted-foreground"; }
  };
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();
  const getProgressPercentage = (completed: number, total: number) => Math.round((completed / total) * 100);

  const handleRefresh = () => {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Enrollment Management</h1>
          <p className="text-muted-foreground">Track student registrations and program participation</p>
        </div>
        <Button className="btn-hero" onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Enrollment
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="card-athletic"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Enrollments</CardTitle><UserPlus className="h-4 w-4 text-primary" /></CardHeader><CardContent><div className="text-2xl font-bold">156</div><p className="text-xs text-muted-foreground">+12 this month</p></CardContent></Card>
        <Card className="card-athletic"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Active</CardTitle><CheckCircle className="h-4 w-4 text-success" /></CardHeader><CardContent><div className="text-2xl font-bold">142</div><p className="text-xs text-muted-foreground">91% active rate</p></CardContent></Card>
        <Card className="card-athletic"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Pending Payment</CardTitle><Clock className="h-4 w-4 text-warning" /></CardHeader><CardContent><div className="text-2xl font-bold">8</div><p className="text-xs text-muted-foreground">Need follow-up</p></CardContent></Card>
        <Card className="card-athletic"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle><DollarSign className="h-4 w-4 text-secondary" /></CardHeader><CardContent><div className="text-2xl font-bold">$21,240</div><p className="text-xs text-muted-foreground">+8% from last month</p></CardContent></Card>
      </div>

      <Card className="card-athletic">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search enrollments..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <Button variant="outline"><Filter className="h-4 w-4 mr-2" />Filter</Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {enrollments.map((enrollment) => (
          <Card key={enrollment.id} className="card-athletic">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex items-center gap-4 lg:w-1/4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={enrollment.trainee.avatar} alt={enrollment.trainee.name} />
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground">{getInitials(enrollment.trainee.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <h3 className="font-semibold truncate">{enrollment.trainee.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">{enrollment.trainee.email}</p>
                  </div>
                </div>
                <div className="lg:w-1/4">
                  <div className="space-y-1">
                    <p className="font-medium">{enrollment.sport}</p>
                    <p className="text-sm text-muted-foreground">{enrollment.program}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground"><Users className="h-3 w-3" />{enrollment.coach} • {enrollment.branch}</div>
                  </div>
                </div>
                <div className="lg:w-1/4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm"><span>Progress</span><span>{enrollment.sessionsCompleted}/{enrollment.totalSessions}</span></div>
                    <div className="w-full bg-muted rounded-full h-2"><div className="h-2 rounded-full bg-primary" style={{ width: `${getProgressPercentage(enrollment.sessionsCompleted, enrollment.totalSessions)}%` }} /></div>
                    <p className="text-xs text-muted-foreground">{getProgressPercentage(enrollment.sessionsCompleted, enrollment.totalSessions)}% complete</p>
                  </div>
                </div>
                <div className="lg:w-1/4 flex flex-col gap-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge className={getStatusColor(enrollment.status)}>{enrollment.status}</Badge>
                    <Badge className={getPaymentStatusColor(enrollment.paymentStatus)}>{enrollment.paymentStatus}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm"><DollarSign className="h-4 w-4 text-muted-foreground" /><span className="font-medium">${enrollment.monthlyFee}/month</span></div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground"><Calendar className="h-3 w-3" /><span>{enrollment.startDate} - {enrollment.endDate}</span></div>
                  <div className="flex gap-2 mt-2">
                    <Button variant="outline" size="sm" className="flex-1">Edit</Button>
                    <Button variant="outline" size="sm" className="flex-1">View</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <BasePagination page={page} totalPages={totalPages} pageSize={pageSize} totalCount={totalCount} onPageChange={setPage} onPageSizeChange={setPageSize} />

      <EnrollmentFormModal open={modalOpen} onOpenChange={setModalOpen} onSuccess={handleRefresh} />
    </div>
  );
};

export default Enrollments;
