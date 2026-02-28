"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2,
  Save,
  User as UserIcon,
  MapPin,
  Building2,
  GraduationCap,
  Linkedin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { updateProfile } from "@/actions/user-actions";
import { MAX_BIO_LENGTH } from "@/lib/constants";
import type { UserRole } from "@prisma/client";

const ROLE_OPTIONS: { value: UserRole; label: string; description: string }[] = [
  { value: "FOUNDER", label: "Founder", description: "I have ideas to validate" },
  { value: "EXPLORER", label: "Explorer", description: "I want to discover and vote" },
  { value: "BOTH", label: "Both", description: "I do both" },
];

interface SettingsFormProps {
  user: {
    name: string;
    image: string | null;
    email: string | null;
    bio: string | null;
    city: string | null;
    state: string | null;
    college: string | null;
    company: string | null;
    linkedinUrl: string | null;
    role: UserRole;
  };
}

export function SettingsForm({ user }: SettingsFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(user.name ?? "");
  const [bio, setBio] = useState(user.bio ?? "");
  const [city, setCity] = useState(user.city ?? "");
  const [state, setState] = useState(user.state ?? "");
  const [college, setCollege] = useState(user.college ?? "");
  const [company, setCompany] = useState(user.company ?? "");
  const [linkedinUrl, setLinkedinUrl] = useState(user.linkedinUrl ?? "");
  const [role, setRole] = useState<UserRole>(user.role);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const fd = new FormData();
      fd.append("name", name.trim());
      fd.append("bio", bio.trim());
      fd.append("city", city.trim());
      fd.append("state", state.trim());
      fd.append("college", college.trim());
      fd.append("company", company.trim());
      fd.append("linkedinUrl", linkedinUrl.trim());
      fd.append("role", role);

      const result = await updateProfile(fd);

      if (result.success) {
        toast.success("Profile updated");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <>
      {/* Profile Picture (from Clerk) */}
      <div className="mt-6 flex items-center gap-4 rounded-xl border border-warm-border bg-white p-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={user.image ?? undefined} />
          <AvatarFallback className="bg-saffron-light text-saffron text-lg font-bold">
            {name?.charAt(0) ?? "U"}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-[14px] font-semibold text-deep-ink">{name}</p>
          <p className="text-[12px] text-text-muted">{user.email}</p>
          <p className="mt-0.5 text-[11px] text-text-muted">
            Profile picture is managed through Google
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        {/* Name */}
        <div>
          <Label htmlFor="name" className="text-[13px] font-semibold text-deep-ink">
            <UserIcon className="mr-1.5 inline h-3.5 w-3.5" />
            Display Name *
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="mt-1.5 input-focus-ring"
            required
          />
        </div>

        {/* Role */}
        <div>
          <Label className="text-[13px] font-semibold text-deep-ink">Your Role</Label>
          <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
            <SelectTrigger className="mt-1.5 input-focus-ring">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label} — {opt.description}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Bio */}
        <div>
          <Label htmlFor="bio" className="text-[13px] font-semibold text-deep-ink">
            Bio
          </Label>
          <Textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={MAX_BIO_LENGTH}
            placeholder="Tell us about yourself..."
            rows={3}
            className="mt-1.5 resize-none input-focus-ring"
          />
          <p className="mt-1 text-right text-[11px] text-text-muted">
            {bio.length}/{MAX_BIO_LENGTH}
          </p>
        </div>

        {/* Location */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="city" className="text-[13px] font-semibold text-deep-ink">
              <MapPin className="mr-1.5 inline h-3.5 w-3.5" />
              City
            </Label>
            <Input
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g., Mumbai"
              className="mt-1.5 input-focus-ring"
            />
          </div>
          <div>
            <Label htmlFor="state" className="text-[13px] font-semibold text-deep-ink">
              State
            </Label>
            <Input
              id="state"
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="e.g., Maharashtra"
              className="mt-1.5 input-focus-ring"
            />
          </div>
        </div>

        {/* Education & Work */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="college" className="text-[13px] font-semibold text-deep-ink">
              <GraduationCap className="mr-1.5 inline h-3.5 w-3.5" />
              College
            </Label>
            <Input
              id="college"
              value={college}
              onChange={(e) => setCollege(e.target.value)}
              placeholder="e.g., IIT Bombay"
              className="mt-1.5 input-focus-ring"
            />
          </div>
          <div>
            <Label htmlFor="company" className="text-[13px] font-semibold text-deep-ink">
              <Building2 className="mr-1.5 inline h-3.5 w-3.5" />
              Company
            </Label>
            <Input
              id="company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g., Google"
              className="mt-1.5 input-focus-ring"
            />
          </div>
        </div>

        {/* LinkedIn */}
        <div>
          <Label htmlFor="linkedin" className="text-[13px] font-semibold text-deep-ink">
            <Linkedin className="mr-1.5 inline h-3.5 w-3.5" />
            LinkedIn URL
          </Label>
          <Input
            id="linkedin"
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
            placeholder="https://linkedin.com/in/yourprofile"
            className="mt-1.5 input-focus-ring"
          />
        </div>

        {/* Submit */}
        <div className="flex justify-end border-t border-warm-border pt-6">
          <Button
            type="submit"
            disabled={isPending || !name.trim()}
            className="gap-1.5 bg-saffron text-white hover:bg-saffron-dark"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </>
  );
}
