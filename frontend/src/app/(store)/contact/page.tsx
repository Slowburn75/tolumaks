"use client";

import { useState } from "react";
import { StoreLayout } from "@/components/layout/StoreLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin } from "lucide-react";
import { contactApi } from "@/lib/api";
import { useSiteSettings } from "@/providers/SiteSettingsProvider";
import toast from "react-hot-toast";

export default function ContactPage() {
  const { settings } = useSiteSettings();
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await contactApi.send(formData);
      toast.success("Message sent! We'll get back to you soon.");
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch {
      toast.error("Failed to send message. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <StoreLayout>
      <div className="max-w-4xl mx-auto px-4 py-12 lg:py-16">
        <h1 className="text-4xl font-bold font-display mb-6">Contact Us</h1>
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <p className="text-muted-foreground mb-8">
              Have a question, feedback, or just want to say hello? We&apos;d love to hear from you.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData((p) => ({ ...p, subject: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData((p) => ({ ...p, message: e.target.value }))}
                  required
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? "Sending..." : "Send Message"}
              </Button>
            </form>
          </div>
          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Email</h3>
                <a
                  href={`mailto:${settings.email}`}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {settings.email}
                </a>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Phone</h3>
                <a
                  href={`tel:${settings.phone.replace(/\s/g, "")}`}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {settings.phone}
                </a>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Address</h3>
                <p className="text-sm text-muted-foreground">{settings.address}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}
