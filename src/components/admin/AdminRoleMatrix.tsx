import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Check, Minus, ShieldCheck } from "lucide-react";
import {
  PERMISSION_ACTIONS,
  ROLES,
  ROLE_LABELS,
  hasPermission,
} from "@/lib/permissions";

const AdminRoleMatrix = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-green-700 dark:text-green-400" />
          Role permissions matrix
        </CardTitle>
        <CardDescription>
          What each role can access. Change a Blink account&apos;s role under
          Users to grant or revoke these permissions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Action</TableHead>
              {ROLES.map((role) => (
                <TableHead key={role} className="text-center capitalize">
                  {ROLE_LABELS[role]}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {PERMISSION_ACTIONS.map((action) => (
              <TableRow key={action.key}>
                <TableCell>
                  <div className="font-medium">{action.label}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {action.description}
                  </div>
                </TableCell>
                {ROLES.map((role) => (
                  <TableCell key={role} className="text-center">
                    {hasPermission(role, action.key) ? (
                      <Check className="mx-auto h-4 w-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <Minus className="mx-auto h-4 w-4 text-gray-300 dark:text-gray-700" />
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default AdminRoleMatrix;
