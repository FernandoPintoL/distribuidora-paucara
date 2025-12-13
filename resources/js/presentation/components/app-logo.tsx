// import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
    const logoSvg = import.meta.env.VITE_LOGO_SVG || '/logo.svg';
    const logoAlt = import.meta.env.VITE_LOGO_ALT || 'Distribuidora Paucara';

    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                {/*<AppLogoIcon className="size-5 fill-current text-white dark:text-black" />*/}
                <img src={logoSvg} alt={logoAlt} className="h-12 w-auto" />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-semibold">{logoAlt}</span>
            </div>
        </>
    );
}
