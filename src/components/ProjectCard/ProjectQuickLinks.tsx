import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { Project } from "@/ProjectsProvider";
import { useFormatLink } from "@/SettingsProvider";

const ProjectQuickLinks: React.FC<{ proj: Project; formatLink: ReturnType<typeof useFormatLink> }> = ({
    proj,
    formatLink,
}) => (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <button className="project-quick-action-btn">
                <img
                    src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAAsTAAALEwEAmpwYAAABmUlEQVR4nN2VzStEYRTGZ3yMQs3/oGymbJSFjx2KUj7Kwl5JjPIfXCvKzmLKQha+yoL/gbKzwaRIYv4BTUSKn06Oel3n3vcdZePZ3Lnvec7z3Pfced6byfxrAA3ACLALnAEPwCNwCWwDk0Djb8UHgFv8uAbGahVfAd4DxC+c39JTFyK+RBjuRRCYA551bdknPl6D+JDT1w+8aG00STwH3HmEe1IeTnYiuDJfPDDle+xM+u5lXOdKnbAI+x7949T5fmoUlbtlFW+0uGOI9/rEVaOg/LJVrGoxD0Qxg74EQcnJKpDV+2blVy2yJFTQqveRb1TOWukrA1IHjiwDib+g4KxFloNhINgE6tPmt6HEYmw9CjQQ7CWeTcCwE/9vkSfcQHAINFkGWeBUSfOxWqUGA8Fs0i66gFeN/WBsd5UUA+kRHCS+A6dpRk9SMVlwx2UYCG8NWNTSG9AeYjLtHF5lNeowDLr1mndyVPIaaFMncGINOIEvOxE8AS1BJtooX7Z1zYmE8WeIPnlt+kmVIycXbFAL5BQw/6J/iQ8xje2qB77gBAAAAABJRU5ErkJggg=="
                    alt="internet"
                    className="project-quick-action-icon"
                />
            </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="min-w-[10em] bg-zinc-800 border-zinc-600 p-1 z-50 rounded-selector shadow-lg">
            <DropdownMenuLabel>Project Links</DropdownMenuLabel>
            <DropdownMenuSeparator className="h-px bg-zinc-600 my-1" />
            {proj.quickLinks && proj.quickLinks.length > 0 ? (
                proj.quickLinks.map((link, idx) => {
                    if (link.url) {
                        return (
                            <DropdownMenuItem
                                key={idx}
                                className="data-[highlighted]:bg-zinc-600 rounded"
                                onClick={() => window.open(formatLink(proj.name, link.url!), "_blank")}
                            >
                                {link.label}
                            </DropdownMenuItem>
                        );
                    } else if (link.children && link.children.length > 0) {
                        return (
                            <DropdownMenuSub key={idx}>
                                <DropdownMenuSubTrigger className="data-[highlighted]:bg-zinc-600 rounded">
                                    {link.label}
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent className="bg-zinc-800 border-zinc-600 rounded-selector shadow-lg">
                                    {link.children.map((child, cidx) =>
                                        child.url ? (
                                            <DropdownMenuItem
                                                key={cidx}
                                                className="data-[highlighted]:bg-zinc-600 rounded"
                                                onClick={() => window.open(formatLink(proj.name, child.url!), "_blank")}
                                            >
                                                {child.label}
                                            </DropdownMenuItem>
                                        ) : (
                                            <DropdownMenuItem key={cidx} disabled>
                                                {child.label}
                                            </DropdownMenuItem>
                                        )
                                    )}
                                </DropdownMenuSubContent>
                            </DropdownMenuSub>
                        );
                    } else {
                        return (
                            <DropdownMenuItem key={idx} disabled>
                                {link.label}
                            </DropdownMenuItem>
                        );
                    }
                })
            ) : (
                <DropdownMenuItem disabled>No links</DropdownMenuItem>
            )}
        </DropdownMenuContent>
    </DropdownMenu>
);

export default ProjectQuickLinks;
