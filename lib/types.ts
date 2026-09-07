export type Site = {
  id: string;
  url: string;
  domain: string;
  title: string;
  image: string;
  createdAt: string;
};

export type SiteIndex = {
  version: 1;
  updatedAt: string;
  sites: Site[];
};
