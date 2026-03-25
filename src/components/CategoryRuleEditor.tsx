import { useState, useMemo } from "react";
import { Plus, Trash2, RotateCcw, Settings2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { CategoryRule, UserCategory, RawUser } from "@/data/dataModels";
import { DEFAULT_RULES, deriveCategory } from "@/data/categoryRules";

const CATEGORIES: UserCategory[] = [
  "Automated/System", "Integration/Technical", "Internal Admin",
  "ePortal B2C", "ePortal B2B", "External/Community Other",
  "Internal Business User", "Other",
];
const FIELDS = ["name", "username", "email", "profileName", "userType"] as const;
const OPERATORS = ["contains", "equals", "regex"] as const;

interface RulePreview {
  matchCount: number;
  sampleProfiles: string[];
  sampleUsernames: string[];
}

function computeRulePreview(rule: CategoryRule, users: RawUser[], priorRules: CategoryRule[]): RulePreview {
  // Users that haven't been matched by prior rules
  const available = users.filter(u => {
    const priorCategory = deriveCategory(u, priorRules);
    return priorCategory === "Other"; // not matched by prior rules
  });

  const matched = available.filter(u => {
    const fieldValue = u[rule.field] || "";
    switch (rule.operator) {
      case "equals": return fieldValue === rule.value;
      case "contains": return fieldValue.toLowerCase().includes(rule.value.toLowerCase());
      case "regex":
        try { return new RegExp(rule.value, "i").test(fieldValue); }
        catch { return false; }
    }
  });

  const profileSet = new Set<string>();
  const usernameSet = new Set<string>();
  matched.forEach(u => {
    if (u.profileName && profileSet.size < 5) profileSet.add(u.profileName);
    if (u.username && usernameSet.size < 3) usernameSet.add(u.username);
  });

  return {
    matchCount: matched.length,
    sampleProfiles: Array.from(profileSet),
    sampleUsernames: Array.from(usernameSet),
  };
}

interface CategoryRuleEditorProps {
  rules: CategoryRule[];
  onSave: (rules: CategoryRule[]) => void;
  rawUsers: RawUser[];
}

export function CategoryRuleEditor({ rules, onSave, rawUsers }: CategoryRuleEditorProps) {
  const [localRules, setLocalRules] = useState<CategoryRule[]>(rules);
  const [open, setOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const sortedRules = useMemo(() =>
    [...localRules].sort((a, b) => a.priority - b.priority),
    [localRules]
  );

  // Compute previews for each rule
  const previews = useMemo(() => {
    if (!showPreview || rawUsers.length === 0) return new Map<string, RulePreview>();
    const map = new Map<string, RulePreview>();
    const sorted = [...localRules].sort((a, b) => a.priority - b.priority);

    for (let i = 0; i < sorted.length; i++) {
      const rule = sorted[i];
      const priorRules = sorted.slice(0, i);
      map.set(rule.id, computeRulePreview(rule, rawUsers, priorRules));
    }
    return map;
  }, [localRules, rawUsers, showPreview]);

  const addRule = () => {
    setLocalRules([...localRules, {
      id: crypto.randomUUID(),
      priority: (localRules.length + 1) * 10,
      category: "Other",
      field: "profileName",
      operator: "contains",
      value: "",
    }]);
  };

  const updateRule = (id: string, patch: Partial<CategoryRule>) => {
    setLocalRules(localRules.map(r => r.id === id ? { ...r, ...patch } : r));
  };

  const deleteRule = (id: string) => {
    setLocalRules(localRules.filter(r => r.id !== id));
  };

  const handleSave = () => {
    onSave(localRules);
    setOpen(false);
  };

  const handleReset = () => {
    setLocalRules([...DEFAULT_RULES]);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) setLocalRules([...rules]); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Settings2 className="h-3.5 w-3.5" /> Category Rules
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>User Category Classification Rules</DialogTitle>
          <DialogDescription>Rules are evaluated in priority order (lowest first). First match wins.</DialogDescription>
        </DialogHeader>

        <div className="border rounded-md overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Priority</TableHead>
                <TableHead className="w-44">Category</TableHead>
                <TableHead className="w-28">Field</TableHead>
                <TableHead className="w-24">Operator</TableHead>
                <TableHead>Value</TableHead>
                {showPreview && <TableHead className="w-20">Matches</TableHead>}
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRules.map((rule) => {
                const preview = previews.get(rule.id);
                return (
                  <Collapsible key={rule.id} asChild>
                    <>
                      <TableRow>
                        <TableCell>
                          <Input
                            type="number"
                            value={rule.priority}
                            onChange={(e) => updateRule(rule.id, { priority: parseInt(e.target.value) || 0 })}
                            className="h-7 w-14 text-xs"
                          />
                        </TableCell>
                        <TableCell>
                          <Select value={rule.category} onValueChange={(v) => updateRule(rule.id, { category: v as UserCategory })}>
                            <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select value={rule.field} onValueChange={(v) => updateRule(rule.id, { field: v as CategoryRule["field"] })}>
                            <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {FIELDS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select value={rule.operator} onValueChange={(v) => updateRule(rule.id, { operator: v as CategoryRule["operator"] })}>
                            <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {OPERATORS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            value={rule.value}
                            onChange={(e) => updateRule(rule.id, { value: e.target.value })}
                            className="h-7 text-xs"
                            placeholder="Match value or regex..."
                          />
                        </TableCell>
                        {showPreview && (
                          <TableCell>
                            {preview && (
                              <CollapsibleTrigger asChild>
                                <Badge variant="secondary" className="cursor-pointer text-xs">
                                  {preview.matchCount}
                                </Badge>
                              </CollapsibleTrigger>
                            )}
                          </TableCell>
                        )}
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteRule(rule.id)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                      {showPreview && preview && preview.matchCount > 0 && (
                        <CollapsibleContent asChild>
                          <TableRow className="bg-muted/20">
                            <TableCell colSpan={7} className="py-2 px-6">
                              <div className="space-y-1 text-xs">
                                {preview.sampleProfiles.length > 0 && (
                                  <div>
                                    <span className="text-muted-foreground font-medium">Profiles: </span>
                                    {preview.sampleProfiles.map(p => (
                                      <Badge key={p} variant="outline" className="mr-1 mb-0.5 text-[10px]">{p}</Badge>
                                    ))}
                                  </div>
                                )}
                                {preview.sampleUsernames.length > 0 && (
                                  <div>
                                    <span className="text-muted-foreground font-medium">Usernames: </span>
                                    {preview.sampleUsernames.map(u => (
                                      <Badge key={u} variant="outline" className="mr-1 mb-0.5 text-[10px] font-mono">{u}</Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        </CollapsibleContent>
                      )}
                    </>
                  </Collapsible>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="flex gap-2 justify-between">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={addRule}><Plus className="h-3.5 w-3.5 mr-1" /> Add Rule</Button>
            <Button variant="outline" size="sm" onClick={handleReset}><RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset to Defaults</Button>
            <Button
              variant={showPreview ? "secondary" : "outline"}
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              disabled={rawUsers.length === 0}
            >
              <Eye className="h-3.5 w-3.5 mr-1" /> {showPreview ? "Hide Preview" : "Preview Matches"}
            </Button>
          </div>
          <Button size="sm" onClick={handleSave}>Save & Apply</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
