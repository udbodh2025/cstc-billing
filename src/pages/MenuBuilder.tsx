
import { PageHeader } from "@/components/ui/page-header";
import MenuBuilderComponent from "@/components/menu/MenuBuilder";

export default function MenuBuilderPage() {
  return (
    <div>
      <PageHeader
        heading="Menu Builder"
        description="Create and manage navigation menus"
      />
      <MenuBuilderComponent />
    </div>
  );
}
