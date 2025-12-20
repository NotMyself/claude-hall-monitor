import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ListTodo, History, Settings } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';

const navItems = [
  { title: 'Overview', icon: LayoutDashboard, path: '/overview' },
  { title: 'Plans', icon: ListTodo, path: '/plans' },
  { title: 'Sessions', icon: History, path: '/sessions' },
  { title: 'Settings', icon: Settings, path: '/settings' },
];

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <h1 className="text-lg font-bold text-primary">Claude Hall Monitor</h1>
      </SidebarHeader>
      <Separator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.path}
                      className={({ isActive }) =>
                        isActive ? 'bg-accent text-accent-foreground' : ''
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 text-xs text-muted-foreground">
        Metrics Dashboard v1.0
      </SidebarFooter>
    </Sidebar>
  );
}
