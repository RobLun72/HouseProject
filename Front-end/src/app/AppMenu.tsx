import { cn } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Link, useLocation } from "react-router-dom";

interface MenuComponentProps {
  topMenu: string;
  paths: string[];
  items: { title: string; path: string; href: string; description: string }[];
}

const components: MenuComponentProps[] = [
  {
    topMenu: "House",
    paths: ["", "report1", "report2"],
    items: [
      {
        title: "Show houses",
        href: "/",
        path: "",
        description: "List of all houses",
      },
    ],
  },
  {
    topMenu: "Temperature",
    paths: ["temperature"],
    items: [
      {
        title: "House Temperatures",
        href: "/temperature",
        path: "temperature",
        description: "View temperatures for all houses and rooms",
      },
      {
        title: "Report temperatures",
        href: "/temperature/report",
        path: "temperature",
        description: "Generate temperature reports for houses and rooms",
      },
    ],
  },
];

export function AppMenu() {
  const location = useLocation();
  const pathParts = location.pathname.split("/");

  return (
    <div className="flex min-w-sm max-w-md md:min-w-3xl md:max-w-7xl items-center justify-between bg-neutral-100 px-4 py-2">
      <div className="flex items-center">
        <Link to="/" className="text-xl font-bold text-app-primary mr-4">
          House project
        </Link>
        <NavigationMenu>
          <NavigationMenuList>
            {components.map((component) => (
              <NavigationMenuItem key={"menu-" + component.topMenu}>
                <NavigationMenuTrigger
                  className={cn(
                    "",
                    component.paths.includes(pathParts[1]) && "underline"
                  )}
                >
                  {component.topMenu}
                </NavigationMenuTrigger>
                <NavigationMenuContent className="bg-appWhite">
                  <ul className="grid w-[200px] gap-3 p-4  grid-cols-1">
                    {component.items.map((item) => (
                      <ListItem
                        key={item.title}
                        title={item.title}
                        href={item.href}
                        className={cn(
                          "",
                          pathParts[1] === item.path &&
                            "bg-app-primary text-white"
                        )}
                      >
                        <ListItemDescription
                          className={cn(
                            "",
                            pathParts[1] !== item.path && "text-gray-400"
                          )}
                        >
                          {item.description}
                        </ListItemDescription>
                      </ListItem>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </div>
  );
}

const ListItem = ({
  className,
  title,
  href,
  children,
}: {
  className: string;
  title: string;
  href: string;
  children: React.ReactNode;
}) => {
  return (
    <li>
      <Link
        to={href}
        className={cn(
          "group block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
          className
        )}
      >
        <div className="text-sm font-medium leading-none">{title}</div>
        {/* <p className="line-clamp-2 text-xs leading-snug text-gray-200 group-hover:text-accent-foreground"> */}
        {children}
        {/* </p> */}
      </Link>
    </li>
  );
};

const ListItemDescription = ({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) => {
  return (
    <p
      className={cn(
        "line-clamp-2 text-xs leading-snug text-gray-200 group-hover:text-accent-foreground",
        className
      )}
    >
      {children}
    </p>
  );
};
