// React
import { useEffect } from 'react';

// StreamLit
import { Streamlit, withStreamlitConnection, ComponentProps } from 'streamlit-component-lib';

// CSS
import './styles/global.css'

interface PropsInterface {
  data: {
    [index: number]: {
      id: number;
      name: string;
      description: string;
      steps: Array<{
        PROCESS_ID: number;
        PROCSS_NAME: string;
        PROCESS_DESCRIPTION: string;
        PROCESS_ACTIVE: 'Y' | 'N';
        PROCESS_CMD_ID: number;
        CMD_TYPE: 'APPEND' | 'COPY_INTO_FILE' | 'DELETE'| 'DI' | 'MERGE' | 'OI' | 'PUBLISH_SCD2_DIM' | 'REFRESH' | 'TI' | 'TRUNCATE';
        CMD_SRC: string;
        CND_TGT: string;
        CMD_WHERE: string;
        CMD_BINDS: string;
        REFRESH_TYPE: 'DI' | null;
        BUSINESS_KEY: string;
        MERGE_ON_FIELDS: string;
        GENERATE_MERGE_MATCHED_CLAUSE: 'Y' | '';
        GENERATE_MERGE_NON_MATCHED_CLAUSE: 'Y' | '';
        ADDITIONAL_FIELDS: string;
        TEMP_TABLE: 'Y' | null;
        CMD_PIVOT_BY: string | null;
        CMD_PIVOT_FIELD: string | null;
        DQ_TYPE: 'DUPS' | 'SCD2' | '';
        CMD_EXTERNAL_CALL: string;
        ACTIVE: 'Y' | 'N'; 
      }>
    }
  }
}

function App(props: ComponentProps) {
  const { data }: PropsInterface = props.args
  useEffect(() => { Streamlit.setFrameHeight() }) // Update frame height on each re-render

  return (
    <>Hello world</>
  )
}

export default withStreamlitConnection(App)