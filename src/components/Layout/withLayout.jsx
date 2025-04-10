import Layout from "./Layout";

export const withLayout = (Component) => {
  return function WithLayout(props) {
    return (
      <Layout>
        <Component {...props} />
      </Layout>
    );
  };
};