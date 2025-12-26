"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from "@/components/ui/sidebar";
import { DotsThreeOutlineIcon } from "@phosphor-icons/react";
import { JSX, useState } from "react";

const data = [
  [
    {
      label: "About",
      dialog: AboutDialog
    }
  ]
];

function AboutDialog() {
  //   const [responseData, setResponseData] = useState<Metrics>();

  //   useEffect(() => {
  //     async function fetchData() {
  //       try {
  //         const [, data] = await GetRequest("server");
  //         setResponseData(data);
  //       } catch {
  //         return;
  //       }
  //     }

  //     fetchData();
  //   }, []);

  return (
    <DialogContent className="w-1/2">
      <DialogHeader />
      <DialogTitle className="flex mx-auto">About</DialogTitle>
      <DialogDescription />
      <img
        src="/mascot.png"
        alt="project-mascot"
        width={100}
        className="mx-auto"
      />
    </DialogContent>
  );
}

export function NavActions() {
  const [isOpen, setIsOpen] = useState(false);
  const [DialogComponent, setDialogComponent] = useState<
    null | ((props: { onClose: () => void }) => JSX.Element)
  >(null);

  const closeDialog = () => {
    setDialogComponent(null);
  };

  return (
    <div>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild className="cursor-pointer">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 data-[state=open]:bg-accent"
          >
            <DotsThreeOutlineIcon />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-56 overflow-hidden rounded-lg p-0"
          align="end"
        >
          <Sidebar collapsible="none" className="bg-transparent">
            <SidebarContent>
              {data.map((group, index) => (
                <SidebarGroup key={index} className="border-b last:border-none">
                  <SidebarGroupContent className="gap-0">
                    <SidebarMenu>
                      {group.map((item, index) => (
                        <SidebarMenuItem key={index}>
                          <SidebarMenuButton
                            className="cursor-pointer"
                            onClick={() => {
                              setIsOpen(false);
                              setDialogComponent(() => item.dialog);
                            }}
                          >
                            <span>{item.label}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              ))}
            </SidebarContent>
          </Sidebar>
        </PopoverContent>
      </Popover>

      {DialogComponent && (
        <Dialog
          open={!!DialogComponent}
          onOpenChange={(open) => {
            if (!open) setDialogComponent(null);
          }}
        >
          <DialogComponent onClose={closeDialog} />
        </Dialog>
      )}
    </div>
  );
}
