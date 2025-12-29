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
import { GetRequest } from "@/util";
import { DotsThreeOutlineIcon, GithubLogoIcon } from "@phosphor-icons/react";
import { JSX, useEffect, useState } from "react";
import { toast } from "sonner";

const data = [
  [
    {
      label: "About",
      dialog: AboutDialog
    }
  ]
];

interface Info {
  version: string;
  commit: string;
  date: string;
}

function AboutDialog() {
  const [info, setInfo] = useState<Info | null>(null);

  useEffect(() => {
    async function fetchData() {
      const [code, data] = await GetRequest("info");

      if (code !== 200) {
        toast.error("Could not fetch server info");
      }

      setInfo(data);
    }

    fetchData();
  }, []);

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
      {info && (
        <div className="flex gap-4">
          <div className="text-muted-foreground">
            <p>Version:</p>
            <p>Commit:</p>
            <p>Built:</p>
          </div>
          <div className="flex flex-col gap-1">
            <a
              href={`https://github.com/pommee/honk/releases/tag/${info.version}`}
              target="#"
              className="text-blue-400 underline"
            >
              {info.version}
            </a>
            <a
              href={`https://github.com/pommee/honk/commit/${info.commit}`}
              target="#"
              className="text-blue-400 underline"
            >
              {info.commit}
            </a>
            <p>
              {new Date(info.date).toLocaleString("en-US", { hour12: false })}
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <GithubLogoIcon className="mt-1" />
        <a
          href={"https://github.com/pommee/honk"}
          target="#"
          className="text-blue-400 underline"
        >
          https://github.com/pommee/honk
        </a>
      </div>
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
