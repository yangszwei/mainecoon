<p align="left">
  <img src="./public/android-chrome-192x192.png" height="96" width="96" alt="" />
</p>

# Mainecoon

Mainecoon is a powerful web-based digital pathology viewer, designed to allow researchers, pathologists, and healthcare professionals to explore and analyze pathology images directly in the browser. This project builds upon the original [cylab-tw/mainecoon](https://github.com/cylab-tw/mainecoon) and evolves to meet modern medical imaging needs.

## Features

- **Whole Slide Image (WSI) Viewer**: Display pathology images using efficient tiling and progressive loading techniques.
- **DICOMweb Compliance**: Integrate with DICOMweb for seamless image rendering and annotation support.
- **Annotation Support**: Create and manage annotations of graphic types defined in the DICOM [Graphic Annotation Module](https://dicom.nema.org/medical/dicom/current/output/chtml/part03/sect_C.10.5.html) for precise image labeling and analysis. Annotations can be stored to the connected DICOMweb server.
- **Advanced Image Interaction**: Pan, zoom, and rotate multi-layer images through OpenLayers for detailed analysis.

## Installation

Before starting, ensure you have configured the environment variables as needed. See the [Configuration](#configuration) section for more information.

### Docker

To quickly start Mainecoon using Docker:

```bash
docker compose up -d
```

### Build from source

#### Dependencies

To run Mainecoon from source, ensure you have the following installed:

- Node.js (v18.18 or later)
- npm

#### Building

Install the dependencies and build the project:

```bash
npm install
npm run build
```

Copy static assets to build output directory:

```bash
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public
```

#### Running

```bash
npm start
```

The viewer should now be accessible at [http://localhost:3000](http://localhost:3000).

## Configuration

### Example

See the [.env.example](./.env.example) file for an example configuration.

### Build Arguments

These variables are prefixed with `NEXT_PUBLIC_` and are inlined during the build process:

- `NEXT_PUBLIC_BASE_PATH`: Base path where the viewer is hosted (useful for subdirectory hosting).
- `NEXT_PUBLIC_DICOMWEB_SERVERS`: Comma-separated list of DICOMweb servers that the viewer can connect to.

#### Example:

```bash
NEXT_PUBLIC_DICOMWEB_SERVERS="name1=https://server1.com,name2=https://server2.com"
```

> The `name=` part is optional and can be used to label servers. The viewer will connect in the order listed.

### Environment Variables

The following variables are used to configure the runtime settings:

- `ORIGIN`: The origin used to determine the base URL of the viewer.
- `PORT`: The port number the server listens on (default: `3000`).
- `AUTH_ENABLED`: Boolean flag to enable or disable authentication (default: false).
- `AUTH_SECRET`: Secret key used to encrypt session data.
- `OIDC_ISSUER`: The issuer URL for the OpenID Connect provider.
- `OIDC_CLIENT_ID`: The client ID for the OpenID Connect provider.
- `OIDC_CLIENT_SECRET`: The client secret for the OpenID Connect provider.

## License

This project is licensed under the [Apache License 2.0](./LICENSE).
