# Autonomous Agent

An autonomous AI software agent that turns text prompts into fully functioning projects.

## Overview

This system is designed to automate the process of software development from a simple text description. The agent:

1. Analyzes project descriptions to extract requirements
2. Plans out the project architecture and structure
3. Creates a detailed task list with dependencies and priorities
4. Implements code for each task autonomously
5. Debugs and tests its own code
6. Continuously improves the project

The agent is built with a modular architecture that allows for extensibility and customization.

## Key Components

- **Core Agent**: Coordinates all subsystems and manages the execution flow
- **Project Analyzer**: Extracts requirements and designs architecture from text descriptions
- **Task Manager**: Creates and manages tasks, dependencies, and priorities
- **Code Generator**: Generates actual code implementations based on tasks
- **Debug System**: Tests and improves code quality autonomously
- **Memory Manager**: Maintains project state and history
- **Logger**: Provides detailed logging and output
- **User Interface**: Handles user interaction and confirmation flows

## Requirements

- Node.js (v16 or later)
- OpenAI API key
- TypeScript (for development)

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Build the project:
   ```
   npm run build
   ```
4. Set up environment variables:
   ```
   export OPENAI_API_KEY="your-api-key-here"
   ```

## Usage

Start the agent with a project description:

```
npm start "Create a web-based task management system with user authentication"
```

Or use the compiled JavaScript directly:

```
node dist/index.js "Create a web-based task management system with user authentication"
```

## Development

For local development:

```
npm run dev "Your project description"
```

## Architecture

The system is designed with clean separation of concerns and modularity in mind:

```
autonomous-agent/
├── core/                  # Core agent functionality
│   ├── agent.ts           # Main agent coordinator
│   ├── openai_connector.ts # AI service connector
│   └── project_analyzer.ts # Project analysis and planning
├── memory/                # Memory and state management
│   ├── memory_manager.ts  # Memory persistence
│   └── project_state.ts   # Project file system state
├── tasks/                 # Task management
│   └── task_manager.ts    # Task creation and tracking
├── code_gen/              # Code generation
│   └── code_generator.ts  # Code implementation
├── debugging/             # Debugging and testing
│   └── debug_system.ts    # Test and improve code
├── logging/               # Logging system
│   └── logger.ts          # Logging functionality
├── ui/                    # User interface
│   └── user_interface.ts  # User interaction
├── index.ts               # Main entry point
├── package.json           # Dependencies
└── tsconfig.json          # TypeScript configuration
```

## Extending the System

The agent can be extended by:

1. Adding new subsystems in their own directories
2. Enhancing existing components with new capabilities
3. Creating custom connectors for different AI services
4. Adding support for different programming languages and frameworks

## License

MIT