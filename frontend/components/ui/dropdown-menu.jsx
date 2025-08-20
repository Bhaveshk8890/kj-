import * as React from "react";
import { cn } from "./utils";

const DropdownMenuContext = React.createContext({
  open: false,
  setOpen: () => {},
});

const DropdownMenu = ({ children }) => {
  const [open, setOpen] = React.useState(false);
  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block">{children}</div>
    </DropdownMenuContext.Provider>
  );
};

const DropdownMenuTrigger = React.forwardRef(
  ({ className, children, asChild, onClick, ...props }, ref) => {
    const { open, setOpen } = React.useContext(DropdownMenuContext);

    const handleClick = (e) => {
      setOpen(!open);
      onClick?.(e);
    };

    if (asChild) {
      return <div onClick={handleClick}>{children}</div>;
    }
    return (
      <button
        ref={ref}
        className={cn("outline-none", className)}
        onClick={handleClick}
        {...props}
      >
        {children}
      </button>
    );
  }
);
DropdownMenuTrigger.displayName = "DropdownMenuTrigger";

const DropdownMenuContent = React.forwardRef(
  (
    { className, align = "center", side = "bottom", sideOffset = 4, ...props },
    ref
  ) => {
    const { open, setOpen } = React.useContext(DropdownMenuContext);

    React.useEffect(() => {
      const handleClickOutside = (event) => {
        if (
          ref &&
          "current" in ref &&
          ref.current &&
          !ref.current.contains(event.target)
        ) {
          setOpen(false);
        }
      };

      if (open) {
        document.addEventListener("mousedown", handleClickOutside);
      }

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [open, ref, setOpen]);

    if (!open) return null;

    return (
      <div
        ref={ref}
        className={cn(
          "absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
          side === "bottom" && "top-full",
          side === "top" && "bottom-full",
          side === "left" && "right-full",
          side === "right" && "left-full",
          align === "start" && "left-0",
          align === "center" && "left-1/2 -translate-x-1/2",
          align === "end" && "right-0",
          className
        )}
        style={{ marginTop: side === "bottom" ? sideOffset : undefined }}
        {...props}
      />
    );
  }
);
DropdownMenuContent.displayName = "DropdownMenuContent";

const DropdownMenuItem = React.forwardRef(
  ({ className, variant = "default", onClick, ...props }, ref) => {
    const { setOpen } = React.useContext(DropdownMenuContext);

    const handleClick = (e) => {
      onClick?.(e);
      setOpen(false);
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
          variant === "destructive" &&
            "text-destructive hover:bg-destructive hover:text-destructive-foreground",
          className
        )}
        onClick={handleClick}
        {...props}
      />
    );
  }
);
DropdownMenuItem.displayName = "DropdownMenuItem";

const DropdownMenuSeparator = React.forwardRef(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("-mx-1 my-1 h-px bg-muted", className)}
      {...props}
    />
  )
);
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
};
