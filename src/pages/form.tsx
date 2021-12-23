import { Formik } from "formik";
import type { NextPage } from "next";

const initialValues = {};

const Form: NextPage = () => {
  return (
    <textarea className="text-mono" contentEditable onChange={console.log}>
      yeeman
      {/* <div className="w-8 h-8 bg-red-500">mi</div> */}
      {/* yeedog */}
    </textarea>
  );
  // return (
  //   <Formik initialValues={initialValues} onSubmit={() => {}}>
  //     {(formikProps) => <div>mi</div>}
  //   </Formik>
  // );
};

export default Form;
