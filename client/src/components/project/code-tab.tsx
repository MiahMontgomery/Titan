import React, { useState } from "react";
import { FolderTree, File, ChevronDown, ChevronRight, FileCode, FolderClosed, FolderOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TitanLogo } from "@/components/ui/titan-logo";

interface FileNode {
  id: string;
  name: string;
  type: "file" | "directory";
  path: string;
  children?: FileNode[];
  content?: string;
  language?: string;
}

interface CodeTabProps {
  projectId: number;
  fileTree: FileNode;
  isLoading?: boolean;
  onFileSelect?: (path: string) => void;
  selectedFile?: string | null;
  fileContent?: string | null;
}

export function CodeTab({ 
  projectId, 
  fileTree, 
  isLoading = false,
  onFileSelect,
  selectedFile,
  fileContent
}: CodeTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    "/": true, // Root is expanded by default
  });

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [path]: !prev[path],
    }));
  };

  const renderTree = (node: FileNode, depth = 0) => {
    const isExpanded = expandedFolders[node.path] || false;
    
    if (node.type === "directory") {
      return (
        <div key={node.id}>
          <div 
            className={`flex items-center py-1 px-2 rounded-md cursor-pointer hover:bg-secondary ${depth > 0 ? 'ml-4' : ''}`}
            onClick={() => toggleFolder(node.path)}
          >
            <div className="w-4 mr-2">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            {isExpanded ? (
              <FolderOpen className="h-4 w-4 text-primary mr-2" />
            ) : (
              <FolderClosed className="h-4 w-4 text-primary mr-2" />
            )}
            <span className="text-sm">{node.name}</span>
          </div>
          
          {isExpanded && node.children && (
            <div>
              {node.children.map((child) => renderTree(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }
    
    return (
      <div 
        key={node.id}
        className={`flex items-center py-1 px-2 rounded-md cursor-pointer hover:bg-secondary ${depth > 0 ? 'ml-4' : ''} ${selectedFile === node.path ? 'bg-secondary' : ''}`}
        onClick={() => onFileSelect && onFileSelect(node.path)}
      >
        <div className="w-4 mr-2"></div>
        <FileCode className="h-4 w-4 text-muted-foreground mr-2" />
        <span className="text-sm">{node.name}</span>
      </div>
    );
  };

  return (
    <div className="flex h-[500px] gap-4">
      {/* File explorer */}
      <div className="w-1/4 border-r border-border pr-2">
        <div className="mb-3">
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-secondary border-border text-sm"
          />
        </div>
        
        <div className="overflow-y-auto h-[450px] scrollbar-thin">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <TitanLogo size={24} spinning />
            </div>
          ) : !fileTree || !fileTree.children || fileTree.children.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FolderTree className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm">No files available</p>
            </div>
          ) : (
            <div className="space-y-1">
              {fileTree.children.map((node) => renderTree(node))}
            </div>
          )}
        </div>
      </div>
      
      {/* Code viewer */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <TitanLogo size={30} spinning />
          </div>
        ) : !selectedFile ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <File className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No File Selected</h3>
            <p className="text-muted-foreground max-w-xs">
              Select a file from the explorer to view its contents
            </p>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            <div className="bg-secondary px-3 py-2 rounded-t-md border border-border">
              <div className="text-sm font-mono">{selectedFile}</div>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin bg-card border-x border-b border-border rounded-b-md p-4">
              <pre className="text-sm font-mono whitespace-pre-wrap">{fileContent || 'No content available'}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}