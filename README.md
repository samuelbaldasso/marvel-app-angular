# Marvel Characters App

A modern Angular application for exploring and managing Marvel characters. Built with Angular 17 and Material UI, this application provides an intuitive interface to browse, search, and manage Marvel characters.

## Features

- **Character Browsing**: View a paginated list of Marvel characters
- **Search Functionality**: Find characters by name
- **Character Details**: View detailed information about each character
- **Character Management**: Create, edit and delete characters
- **Custom Characters**: Create characters with custom attributes like power level and category
- **Responsive Design**: Works on desktop and mobile devices

## Technology Stack

- **Angular 17**: Latest version with standalone components
- **Angular Material**: UI component library
- **RxJS**: Reactive programming library for handling asynchronous operations
- **TypeScript**: Strongly typed programming language
- **CSS/SCSS**: For styling components
- **Jest**: For unit testing
- **Angular CLI**: Command line interface for Angular
- **Marvel API**: For fetching character data
- **Angular Signals**: For state management and reactivity

## Project Structure

The application follows a feature-based structure:

```markdown
src/
├── app/
│   ├── core/           # Core functionality, models, services
│   ├── features/       # Feature modules
│   │   ├── characters/ # Character-related components
│   │   └── ...
│   ├── shared/         # Shared components, directives, pipes
│   └── ...
```

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm (v8+)

### Installation

1. Clone the repository

```bash
git clone https://github.com/samuelbaldasso/marvel-app-angular.git
cd marvel-app-angular
```

2. Install dependencies

```bash
npm install
```

3. Start the development server

```bash
ng serve
```

4. Navigate to `http://localhost:4200/`

## Usage

### Browsing Characters

- The home page displays a list of Marvel characters
- Use the pagination controls to navigate through the list
- Click on any character card to view more details

### Searching Characters

- Use the search box at the top to filter characters by name
- Results update as you type

### Creating Characters

- Click the "Create Character" button to open the character creation dialog
- Fill in the required information and click "Create"

### Custom Character Creation

- Use the custom character form to add specialized character attributes
- Set power levels and categories for your custom characters

## Building for Production

Run `ng build` to build the project for production. The build artifacts will be stored in the `dist/` directory.

```bash
ng build
```

## Running Tests

### Unit Tests

```bash
ng test
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Marvel API](https://developer.marvel.com/) for providing character data
- [Angular](https://angular.io/) for the awesome framework
- [Material Design](https://material.io/) for the UI components

## Contact

- Samuel Baldasso

- Project Link: [https://github.com/samuelbaldasso/marvel-app-angular](https://github.com/samuelbaldasso/marvel-app-angular)
# marvel-app-angular
