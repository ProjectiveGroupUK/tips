// StreamLit
import { withStreamlitConnection, ComponentProps } from 'streamlit-component-lib';

// Contexts
import ProcessTableDataContextProvider from '@/contexts/ProcessTableDataContext';
import ProcessModalDataContextProvider from '@/contexts/ProcessModalDataContex';
import CommandModalDataContextProvider from '@/contexts/CommandModalDataContext';

// Components
import ProcessTable from '@/components/ProcessTable/ProcessTable';
import ProcessModal from './components/ProcessModal/ProcessModal';
import EditCommandModal from '@/components/EditCommandModal/EditCommandModal';

// Interfaces
import { ProcessDataInterface, CommandDataInterface, ExecutionStatusInterface } from '@/interfaces/Interfaces';

// Enums
import { OperationType } from '@/enums/enums';

interface ComponentPropsWithArgs extends ComponentProps {
  args: PropsInterface_ProcessTable | PropsInterface_ProcessModal | PropsInterface_CommandModal;
}

export interface PropsInterface_ProcessTable {
  component: 'ProcessTable';
  processData: ProcessDataInterface[];
  instructions: {
    resetEditProcess: boolean;
    resetProcessTableCommand: boolean;
  }
}

export interface PropsInterface_ProcessModal {
  component: 'ProcessModal';
  process: {
    operation: {
      type: OperationType;
    }
    process: ProcessDataInterface;
  }
  instructions: {
    processExecutionStatus: ExecutionStatusInterface;
  }
}

export interface PropsInterface_CommandModal {
  component: 'CommandModal';
  commandData: {
    operation: {
      type: OperationType;
    }
    process: ProcessDataInterface;
    command: Partial<CommandDataInterface> | null;
  },
  instructions: {
    commandExecutionStatus: ExecutionStatusInterface;
  }
}

function App(props: ComponentPropsWithArgs) {
  const { component } = props.args;

  switch (component) {
    case 'ProcessTable':
      return (
        <ProcessTableDataContextProvider {...props.args}>
          <ProcessTable />
        </ProcessTableDataContextProvider>
      );

    case 'ProcessModal':
      return (
        <ProcessModalDataContextProvider {...props.args}>
          <ProcessModal />
        </ProcessModalDataContextProvider>
      );

    case 'CommandModal':
      return (
        <CommandModalDataContextProvider {...props.args}>
          <EditCommandModal />
        </CommandModalDataContextProvider>
      );

      default:
        return <p>Invalid component name</p>;
  }
}

export default withStreamlitConnection(App);