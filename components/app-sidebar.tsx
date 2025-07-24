"use client"

import type * as React from "react"
import { Bot, Home, Upload, Users, GitBranch, BarChart3, Settings, HelpCircle, LogOut } from "lucide-react"
import { usePathname } from "next/navigation"
import Link from "next/link"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Navigation items
const navigationItems = [
  {
    title: "Home",
    url: "/",
    icon: Home,
  },
  {
    title: "Upload OKRs",
    url: "/upload",
    icon: Upload,
  },
  {
    title: "Archetypals",
    url: "/Archetypals",
    icon: Users,
  },
  {
    title: "AnythingLLM",
    url: "/AnythingLLM",
    icon: GitBranch,
  },
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: BarChart3,
  },
]

// Settings and help items
const secondaryItems = [
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
  {
    title: "Help & Support",
    url: "/help",
    icon: HelpCircle,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

  return (
    <Sidebar 
      collapsible="icon" 
      className="bg-gradient-to-b from-gray-100 to-gray-50 border-r border-gray-200 dark:bg-gradient-to-b dark:from-gray-900 dark:to-gray-800 dark:border-gray-700"
      {...props}
    >
      <SidebarHeader className="border-b border-gray-200 dark:border-gray-700">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              size="lg" 
              asChild
              className="hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-colors duration-200"
            >
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md">
                  <Bot className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold text-gray-900 dark:text-white">AgentFlow</span>
                  <span className="truncate text-xs text-gray-500 dark:text-gray-400">OKR Orchestration</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider px-4">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.url}
                    className={`transition-all duration-200 ${pathname === item.url 
                      ? "bg-blue-50 text-blue-600 dark:bg-gray-700 dark:text-blue-400 shadow-inner" 
                      : "text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700/50"}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                      {pathname === item.url && (
                        <div className="absolute right-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-l bg-blue-500" />
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-6">
          <SidebarGroupLabel className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider px-4">
            Configuration
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.url}
                    className={`transition-all duration-200 ${pathname === item.url 
                      ? "bg-blue-50 text-blue-600 dark:bg-gray-700 dark:text-blue-400 shadow-inner" 
                      : "text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700/50"}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                      {pathname === item.url && (
                        <div className="absolute right-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-l bg-blue-500" />
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-gray-200 dark:border-gray-700 py-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700/50 transition-colors duration-200"
                >
                  <Avatar className="h-8 w-8 rounded-lg border border-gray-300 dark:border-gray-600">
                    <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
                    <AvatarFallback className="rounded-lg bg-gradient-to-br from-gray-500 to-gray-600 text-white">
                      U
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium text-gray-900 dark:text-white">User</span>
                    <span className="truncate text-xs text-gray-500 dark:text-gray-400">user@example.com</span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg bg-white border border-gray-200 shadow-lg overflow-hidden dark:bg-gray-800 dark:border-gray-700"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem className="focus:bg-gray-100 focus:text-gray-900 text-gray-700 dark:focus:bg-gray-700 dark:text-gray-300">
                  <Settings className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                  Account Settings
                </DropdownMenuItem>
                <DropdownMenuItem className="focus:bg-gray-100 focus:text-gray-900 text-gray-700 dark:focus:bg-gray-700 dark:text-gray-300">
                  <HelpCircle className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                  Support
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                <DropdownMenuItem className="focus:bg-red-50 focus:text-red-600 text-gray-700 dark:focus:bg-red-900/30 dark:text-gray-300">
                  <LogOut className="mr-2 h-4 w-4 text-red-500 dark:text-red-400" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

// "use client"

// import type * as React from "react"
// import { Bot, Home, Upload, Users, GitBranch, BarChart3, Settings, HelpCircle, LogOut } from "lucide-react"
// import { usePathname } from "next/navigation"
// import Link from "next/link"

// import {
//   Sidebar,
//   SidebarContent,
//   SidebarFooter,
//   SidebarGroup,
//   SidebarGroupContent,
//   SidebarGroupLabel,
//   SidebarHeader,
//   SidebarMenu,
//   SidebarMenuButton,
//   SidebarMenuItem,
//   SidebarRail,
// } from "@/components/ui/sidebar"
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu"

// // Navigation items
// const navigationItems = [
//   {
//     title: "Home",
//     url: "/",
//     icon: Home,
//   },
//   {
//     title: "Upload OKRs",
//     url: "/upload",
//     icon: Upload,
//   },
//   {
//     title: "Archetypals",
//     url: "/Archetypals",
//     icon: Users,
//   },
//   {
//     title: "AnythingLLM",
//     url: "/AnythingLLM",
//     icon: GitBranch,
//   },
//   {
//     title: "Dashboard",
//     url: "/dashboard",
//     icon: BarChart3,
//   },
// ]

// // Settings and help items
// const secondaryItems = [
//   {
//     title: "Settings",
//     url: "/settings",
//     icon: Settings,
//   },
//   {
//     title: "Help & Support",
//     url: "/help",
//     icon: HelpCircle,
//   },
// ]

// export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
//   const pathname = usePathname()

//   return (
//     <Sidebar collapsible="icon" {...props}>
//       <SidebarHeader>
//         <SidebarMenu>
//           <SidebarMenuItem>
//             <SidebarMenuButton size="lg" asChild>
//               <Link href="/">
//                 <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-blue-600 text-sidebar-primary-foreground">
//                   <Bot className="size-4" />
//                 </div>
//                 <div className="grid flex-1 text-left text-sm leading-tight">
//                   <span className="truncate font-semibold">AgentFlow</span>
//                   <span className="truncate text-xs">OKR Orchestration</span>
//                 </div>
//               </Link>
//             </SidebarMenuButton>
//           </SidebarMenuItem>
//         </SidebarMenu>
//       </SidebarHeader>

//       <SidebarContent>
//         <SidebarGroup>
//           <SidebarGroupLabel>Navigation</SidebarGroupLabel>
//           <SidebarGroupContent>
//             <SidebarMenu>
//               {navigationItems.map((item) => (
//                 <SidebarMenuItem key={item.title}>
//                   <SidebarMenuButton asChild isActive={pathname === item.url}>
//                     <Link href={item.url}>
//                       <item.icon />
//                       <span>{item.title}</span>
//                     </Link>
//                   </SidebarMenuButton>
//                 </SidebarMenuItem>
//               ))}
//             </SidebarMenu>
//           </SidebarGroupContent>
//         </SidebarGroup>

//         <SidebarGroup>
//           <SidebarGroupLabel>Configuration</SidebarGroupLabel>
//           <SidebarGroupContent>
//             <SidebarMenu>
//               {secondaryItems.map((item) => (
//                 <SidebarMenuItem key={item.title}>
//                   <SidebarMenuButton asChild isActive={pathname === item.url}>
//                     <Link href={item.url}>
//                       <item.icon />
//                       <span>{item.title}</span>
//                     </Link>
//                   </SidebarMenuButton>
//                 </SidebarMenuItem>
//               ))}
//             </SidebarMenu>
//           </SidebarGroupContent>
//         </SidebarGroup>
//       </SidebarContent>

//       <SidebarFooter>
//         <SidebarMenu>
//           <SidebarMenuItem>
//             <DropdownMenu>
//               <DropdownMenuTrigger asChild>
//                 <SidebarMenuButton
//                   size="lg"
//                   className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
//                 >
//                   <Avatar className="h-8 w-8 rounded-lg">
//                     <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
//                     <AvatarFallback className="rounded-lg">U</AvatarFallback>
//                   </Avatar>
//                   <div className="grid flex-1 text-left text-sm leading-tight">
//                     <span className="truncate font-semibold">User</span>
//                     <span className="truncate text-xs">user@example.com</span>
//                   </div>
//                 </SidebarMenuButton>
//               </DropdownMenuTrigger>
//               <DropdownMenuContent
//                 className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
//                 side="bottom"
//                 align="end"
//                 sideOffset={4}
//               >
//                 <DropdownMenuItem>
//                   <Settings className="mr-2 h-4 w-4" />
//                   Account Settings
//                 </DropdownMenuItem>
//                 <DropdownMenuItem>
//                   <HelpCircle className="mr-2 h-4 w-4" />
//                   Support
//                 </DropdownMenuItem>
//                 <DropdownMenuSeparator />
//                 <DropdownMenuItem>
//                   <LogOut className="mr-2 h-4 w-4" />
//                   Log out
//                 </DropdownMenuItem>
//               </DropdownMenuContent>
//             </DropdownMenu>
//           </SidebarMenuItem>
//         </SidebarMenu>
//       </SidebarFooter>
//       <SidebarRail />
//     </Sidebar>
//   )
// }
