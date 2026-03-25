import { useState } from "react";
import { Plus, Trash2, RotateCcw, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import type { CategoryRule, UserCategory } from "@/data/dataModels";
import { DEFAULT_RULES } from "@/data/categoryRules";

const CATEGORIES: UserCategory[] = ["Automated/System", "Integration", "Admin", "External/Community", "Internal Business User", "Other"];
const FIELDS = ["name", "username", "email", "profileName", "userType"] as const;
const OPERATORS = ["contains", "equals", "regex"] as const;

interface CategoryRuleEditorProps {
  rules: CategoryRule[];
  onSave: (rules: CategoryRule[]) => void;
}

export function CategoryRuleEditor({ rules, onSave }: CategoryRuleEditorProps) {
  const [localRules, setLocalRules] = useState<CategoryRule[]>(rules);
  const [open, setOpen] = useState(false);

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
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>User Category Classification Rules</DialogTitle>
          <DialogDescription>Rules are evaluated in priority order (lowest first). First match wins.</DialogDescription>
        </DialogHeader>

        <div className="border rounded-md overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Priority</TableHead>
                <TableHead className="w-40">Category</TableHead>
                <TableHead className="w-28">Field</TableHead>
                <TableHead className="w-24">Operator</TableHead>
                <TableHead>Value</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {localRules.sort((a, b) => a.priority - b.priority).map((rule) => (
                <TableRow key={rule.id}>
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
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteRule(rule.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex gap-2 justify-between">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={addRule}><Plus className="h-3.5 w-3.5 mr-1" /> Add Rule</Button>
            <Button variant="outline" size="sm" onClick={handleReset}><RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset to Defaults</Button>
          </div>
          <Button size="sm" onClick={handleSave}>Save & Apply</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
