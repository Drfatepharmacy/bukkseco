import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Save, Settings, Shield } from "lucide-react";

export const AdminSettings = () => {
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data, error } = await supabase.from("system_settings").select("*");
    if (error) {
      toast.error("Failed to load settings");
    } else {
      setSettings(data || []);
    }
    setLoading(false);
  };

  const handleUpdate = async (id: string, value: any) => {
    setSaving(id);
    const { error } = await supabase
      .from("system_settings")
      .update({ value, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update setting");
    } else {
      toast.success("Setting updated");
      setSettings(prev => prev.map(s => s.id === id ? { ...s, value } : s));
    }
    setSaving(null);
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="w-6 h-6 text-primary" />
        <h2 className="font-display text-2xl font-bold">Platform Configuration</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {settings.map((setting) => (
          <Card key={setting.id} className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                {setting.key.replace(/_/g, " ").toUpperCase()}
                <Settings className="w-4 h-4 text-muted-foreground" />
              </CardTitle>
              <p className="text-xs text-muted-foreground font-body">{setting.description}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {typeof setting.value === 'object' ? (
                  <pre className="text-[10px] bg-muted p-2 rounded overflow-x-auto">
                    {JSON.stringify(setting.value, null, 2)}
                  </pre>
                ) : (
                  <Input
                    defaultValue={setting.value}
                    onBlur={(e) => {
                      if (e.target.value !== String(setting.value)) {
                        handleUpdate(setting.id, e.target.value);
                      }
                    }}
                    className="font-body"
                  />
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">
                Last updated: {new Date(setting.updated_at).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
