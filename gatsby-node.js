const path = require('path');

const createExcerptsList = require('./gatsby/node/excerpts-list');
const createPost = require('./gatsby/node/post');
const createPlainListByTag = require('./gatsby/node/plain-list-by-tag');

const query = `
{
  site {
    siteMetadata {
      featured {
        popular
      }
      githubCommentsRepository
    }
  }
  allMarkdownRemark(
    sort: { 
      fields: [frontmatter___published], 
      order: DESC 
    }, 
    filter: {
      frontmatter: { 
        type: {
          eq: "post"
        }
      }
    },
    limit: 1000
  ) {
    edges {
      node {
        frontmatter {
          title
          slug
          tags
          recommended
        }
      }
    }
  }
}`;

exports.createPages = async ({ graphql, actions }) => {
  const { createPage } = actions;
  const result = await graphql(query);
  if (result.errors) {
    // eslint-disable-next-line no-console
    console.log(result.errors);
    throw result.errors;
  }
  const githubCommentsRepository = result.data.site.siteMetadata.githubCommentsRepository;
  // Create blog posts pages.
  const edges = result.data.allMarkdownRemark.edges;
  createExcerptsList(createPage, edges, githubCommentsRepository);
  const popular = result.data.site.siteMetadata.featured.popular;
  createPost(createPage, edges, popular, githubCommentsRepository);
  createPlainListByTag(createPage, edges);
  return result;  
};

exports.onCreateWebpackConfig = ({ stage, actions, getConfig  }) => {
  actions.setWebpackConfig({
    resolve: {
      modules: [path.resolve(__dirname, 'src'), 'node_modules'],
    },
  });

  // Remove CSS ordering logs
  if (stage === 'build-javascript') {
    const config = getConfig();
    const miniCssExtractPlugin = config.plugins.find(
      plugin => plugin.constructor.name === 'MiniCssExtractPlugin'
    );
    if (miniCssExtractPlugin) {
      miniCssExtractPlugin.options.ignoreOrder = true;
    }
    actions.replaceWebpackConfig(config);
  }
};
