import { motion } from "framer-motion";
import { Project } from "@shared/schema";
import { useProjectContext } from "@/contexts/ProjectContext";
import { Button } from "./ui/button";
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";

interface ProjectCardProps {
  project: Project;
  isActive: boolean;
  onClick: () => void;
}

export function ProjectCard({ project, isActive, onClick }: ProjectCardProps) {
  const { deleteProject, isDeletingProject } = useProjectContext();

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteProject(project.id);
    } catch (error) {
      console.error("Failed to delete project:", error);
    }
  };

  return (
    <motion.div
      className={`
        min-w-[280px] rounded-md p-4 bg-[#0e0e0e] border 
        ${isActive ? 'border-[#01F9C6] glow-pulse' : 'border-[#4A4A4A]'}
        cursor-pointer transition-all duration-300
      `}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="font-semibold truncate text-white">{project.name}</h3>
          <p className="text-sm text-[#A9A9A9] truncate mt-1">
            {project.prompt.length > 40 ? `${project.prompt.substring(0, 40)}...` : project.prompt}
          </p>
          <div className="flex items-center mt-2">
            <span className="inline-block w-2 h-2 rounded-full bg-[#01F9C6] mr-2"></span>
            <span className="text-xs text-[#A9A9A9]">Active</span>
          </div>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-[#A9A9A9] hover:text-red-500"
              disabled={isDeletingProject}
              onClick={(e) => e.stopPropagation()}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-[#1a1a1a] border border-[#4A4A4A]">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">Delete Project</AlertDialogTitle>
              <AlertDialogDescription className="text-[#A9A9A9]">
                Are you sure you want to delete this project? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-[#2a2a2a] text-white hover:bg-[#3a3a3a]">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </motion.div>
  );
}
