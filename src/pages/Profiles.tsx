import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Users,
  Plus,
  Search,
  Filter,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Heart,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type MedicalInfo = {
  bloodType?: string;
  allergies: string[];
  conditions: string[];
  medications: string[];
};

type EmergencyContact = {
  name: string;
  relationship: string;
  phone: string;
};

type Profile = {
  id: number;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  avatar: string;
  role: string;
  joinDate: string;
  emergencyContact: EmergencyContact;
  medicalInfo: MedicalInfo;
  sports: string[];
  branch: string;
  status: string;
  certifications?: string[];
};

const Profiles = () => {
  const [searchTerm, setSearchTerm] = useState("");

  // Mock profile data
  const profiles = [
    {
      id: 1,
      name: "Alex Thompson",
      email: "alex.thompson@email.com",
      phone: "+1 234 567 8901",
      dateOfBirth: "1995-06-15",
      address: "123 Main St, City Center",
      avatar: "/api/placeholder/80/80",
      role: "Trainee",
      joinDate: "2024-01-15",
      emergencyContact: {
        name: "Jennifer Thompson",
        relationship: "Mother",
        phone: "+1 234 567 8902",
      },
      medicalInfo: {
        bloodType: "O+",
        allergies: ["Peanuts"],
        conditions: ["Asthma"],
        medications: ["Inhaler"],
      },
      sports: ["Basketball", "Tennis"],
      branch: "Main Campus",
      status: "Active",
    },
    {
      id: 2,
      name: "Sarah Wilson",
      email: "sarah.wilson@email.com",
      phone: "+1 234 567 8903",
      dateOfBirth: "1988-03-22",
      address: "456 Oak Ave, Downtown",
      avatar: "/api/placeholder/80/80",
      role: "Coach",
      joinDate: "2022-08-10",
      emergencyContact: {
        name: "Mark Wilson",
        relationship: "Spouse",
        phone: "+1 234 567 8904",
      },
      medicalInfo: {
        bloodType: "A+",
        allergies: [],
        conditions: [],
        medications: [],
      },
      sports: ["Swimming", "Water Polo"],
      branch: "Main Campus",
      status: "Active",
      certifications: ["CPR Certified", "First Aid", "Swimming Instructor"],
    },
    {
      id: 3,
      name: "Mike Johnson",
      email: "mike.johnson@email.com",
      phone: "+1 234 567 8905",
      dateOfBirth: "2010-11-08",
      address: "789 Pine St, Westside",
      avatar: "/api/placeholder/80/80",
      role: "Trainee",
      joinDate: "2024-02-01",
      emergencyContact: {
        name: "Lisa Johnson",
        relationship: "Mother",
        phone: "+1 234 567 8906",
      },
      medicalInfo: {
        bloodType: "B+",
        allergies: ["Latex"],
        conditions: [],
        medications: [],
      },
      sports: ["Tennis"],
      branch: "Downtown",
      status: "Active",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-success text-success-foreground";
      case "Inactive":
        return "bg-muted text-muted-foreground";
      case "Suspended":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Trainee":
        return "bg-primary/10 text-primary";
      case "Coach":
        return "bg-secondary/10 text-secondary";
      case "Employee":
        return "bg-success/10 text-success";
      case "Admin":
        return "bg-warning/10 text-warning";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  const hasMedicalConcerns = (medicalInfo: MedicalInfo) => {
    return (
      (medicalInfo.allergies && medicalInfo.allergies.length > 0) ||
      (medicalInfo.conditions && medicalInfo.conditions.length > 0) ||
      (medicalInfo.medications && medicalInfo.medications.length > 0)
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient">
            Profile Management
          </h1>
          <p className="text-muted-foreground">
            Manage user profiles and personal information
          </p>
        </div>
        <Button className="btn-hero">
          <Plus className="h-4 w-4 mr-2" />
          Add Profile
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="card-athletic">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Profiles
            </CardTitle>
            <User className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">187</div>
            <p className="text-xs text-muted-foreground">All users</p>
          </CardContent>
        </Card>

        <Card className="card-athletic">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trainees</CardTitle>
            <Users className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">83% of total</p>
          </CardContent>
        </Card>

        <Card className="card-athletic">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Medical Alerts
            </CardTitle>
            <Heart className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>

        <Card className="card-athletic">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Incomplete Profiles
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">Need updates</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="card-athletic">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search profiles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Profiles Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {profiles.map((profile: Profile) => (
          <Card key={profile.id} className="card-athletic">
            <CardContent className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={profile.avatar} alt={profile.name} />
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                      {getInitials(profile.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg">{profile.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Age {calculateAge(profile.dateOfBirth)} • {profile.branch}
                    </p>
                    <div className="flex gap-2 mt-1">
                      <Badge className={getRoleColor(profile.role)}>
                        {profile.role}
                      </Badge>
                      <Badge className={getStatusColor(profile.status)}>
                        {profile.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                {hasMedicalConcerns(profile.medicalInfo) && (
                  <AlertTriangle className="h-5 w-5 text-warning" />
                )}
              </div>

              {/* Contact Info */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{profile.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{profile.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {profile.address}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Joined {profile.joinDate}
                  </span>
                </div>
              </div>

              {/* Sports */}
              <div className="mb-4">
                <p className="text-sm font-medium mb-2">Sports</p>
                <div className="flex flex-wrap gap-1">
                  {profile.sports.map((sport) => (
                    <Badge key={sport} variant="secondary" className="text-xs">
                      {sport}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="mb-4">
                <p className="text-sm font-medium mb-2">Emergency Contact</p>
                <div className="text-sm text-muted-foreground">
                  <p>
                    {profile.emergencyContact.name} (
                    {profile.emergencyContact.relationship})
                  </p>
                  <p>{profile.emergencyContact.phone}</p>
                </div>
              </div>

              {/* Medical Info (if concerns exist) */}
              {hasMedicalConcerns(profile.medicalInfo) && (
                <div className="mb-4 p-3 rounded-lg bg-warning/10 border border-warning/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="h-4 w-4 text-warning" />
                    <p className="text-sm font-medium text-warning">
                      Medical Information
                    </p>
                  </div>
                  <div className="text-xs space-y-1">
                    {profile.medicalInfo.allergies.length > 0 && (
                      <p>
                        <strong>Allergies:</strong>{" "}
                        {profile.medicalInfo.allergies.join(", ")}
                      </p>
                    )}
                    {profile.medicalInfo.conditions.length > 0 && (
                      <p>
                        <strong>Conditions:</strong>{" "}
                        {profile.medicalInfo.conditions.join(", ")}
                      </p>
                    )}
                    {profile.medicalInfo.medications.length > 0 && (
                      <p>
                        <strong>Medications:</strong>{" "}
                        {profile.medicalInfo.medications.join(", ")}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Certifications (for coaches) */}
              {profile.role === "Coach" && profile.certifications && (
                <div className="mb-4">
                  <p className="text-sm font-medium mb-2">Certifications</p>
                  <div className="flex flex-wrap gap-1">
                    {profile.certifications.map((cert: string) => (
                      <Badge
                        key={cert}
                        className="text-xs bg-success/10 text-success"
                      >
                        {cert}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <FileText className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  View Full
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Profiles;
