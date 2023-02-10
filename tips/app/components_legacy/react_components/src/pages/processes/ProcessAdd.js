// @mui
import { Container } from '@mui/material';
// components
import { useSettingsContext } from '../../components/settings';
import CustomBreadcrumbs from '../../components/custom-breadcrumbs';
// sections
import ProcessNewEditForm from '../../sections/processes/ProcessNewEditForm';

// ----------------------------------------------------------------------

export default function ProcessAdd() {
  const { themeStretch } = useSettingsContext();

  return (
    <>
      <Container maxWidth={themeStretch ? false : 'lg'}>
        <CustomBreadcrumbs
          heading="Add a new process"
          links={[
            {
              name: 'Process',
              // href: Streamlit.setComponentValue({ nextAction: "ProcessList" })
            },
            { name: 'New Process' },
          ]}
        />
        <ProcessNewEditForm />
      </Container>
    </>
  );
}
