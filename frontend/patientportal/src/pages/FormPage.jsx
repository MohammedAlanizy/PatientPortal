import RequestForm from '@/components/dashboard/RequestForm';
import LiveRequests from '@/components/dashboard/LiveRequests';

const FormPage = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="space-y-6 ">
      <RequestForm isPublic={false} />
      </div>
      <div className="space-y-6">
        <LiveRequests />
      </div>
    </div>
  );
};

export default FormPage;