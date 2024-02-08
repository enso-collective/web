import {
  DevicePhoneMobileIcon,
  EllipsisVerticalIcon,
  LockClosedIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import {useContext, useEffect, useMemo, useState} from 'react';
import Toggle from './toggle';
import LoginMethodButton from './login-method-button';
import {WalletIcon} from '@heroicons/react/24/outline';
import CanvasSidebarHeader from './canvas-sidebar-header';
import PrivyConfigContext, {
  PrivyConfigContextType,
  privyLogo,
  privyLogoDark,
} from '../lib/hooks/usePrivyConfig';
import {classNames} from '../lib/classNames';
import {isDark} from '../lib/color';
import {isValidUrl} from '@datadog/browser-core';
import Image from 'next/image';
import AppleIcon from './icons/social/apple';
import GitHubIcon from './icons/social/github';
import TikTokIcon from './icons/social/tiktok';
import PhaverIcon from './icons/social/phaver';
import TwitterXIcon from './icons/social/twitter-x';
import FarcasterIcon from './icons/social/farcaster';

function getLogo(hex: `#${string}`, userLogoUrl: string) {
  return isValidUrl(userLogoUrl) ? userLogoUrl : isDark(hex) ? privyLogoDark : privyLogo;
}

function StaticColorPicker({
  hex,
  config,
  setConfig,
  configAttr = 'theme',
  border = false,
  userLogoUrl = '',
}: {
  hex: `#${string}`;
  config: PrivyConfigContextType['config'];
  setConfig: PrivyConfigContextType['setConfig'];
  configAttr?: 'accentColor' | 'theme';
  border?: boolean;
  userLogoUrl?: string;
}) {
  const logoConfig = configAttr === 'theme' ? {logo: getLogo(hex, userLogoUrl)} : {};
  return (
    <div
      className={classNames(
        'h-6 w-6 cursor-pointer rounded-full border',
        border ? 'border-privy-color-foreground-4' : 'border-privy-color-background',
      )}
      style={{backgroundColor: hex}}
      onClick={() =>
        setConfig?.({
          ...config,
          appearance: {
            ...config.appearance,
            [configAttr]: hex,
            ...logoConfig,
          },
        })
      }
    />
  );
}

type AuthConfiguration = 'wallets' | 'socials';

export default function CanvasSidebarAuthConfig({
  readyToSetTheme,
  className,
}: {
  readyToSetTheme: boolean;
  className?: string;
}) {
  const [draggedConfig, setDraggedConfig] = useState<AuthConfiguration | null>(null);
  const {config, setConfig} = useContext(PrivyConfigContext);
  const [defaultConfigStyles, setDefaultConfigStyles] = useState<string>(
    '!border-b-privy-color-background !border-t-privy-color-background cursor-grab',
  );
  const [userLogoUrl, setUserLogoUrl] = useState<string>('');

  useEffect(() => {
    if (!readyToSetTheme) {
      return;
    }
    setConfig?.({
      ...config,
      appearance: {
        ...config.appearance,
        logo: getLogo(config?.appearance?.theme as `#${string}`, userLogoUrl),
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLogoUrl, readyToSetTheme]);

  const handleDrag = (e: React.DragEvent<HTMLDivElement>, config: AuthConfiguration) => {
    setDraggedConfig(config);
    e.currentTarget.classList.add('!border-privy-color-background', 'rounded-md');
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!draggedConfig) return;
    const isTarget = e.currentTarget.id !== draggedConfig;
    const borderBottom =
      (draggedConfig === 'wallets' && config.appearance?.showWalletLoginFirst) ||
      (draggedConfig === 'socials' && !config.appearance?.showWalletLoginFirst);

    if (isTarget) {
      setDefaultConfigStyles('');
      e.currentTarget.classList.add(
        borderBottom ? '!border-b-privy-color-accent' : '!border-t-privy-color-accent',
      );
      setDefaultConfigStyles('!border-t-privy-color-background cursor-grabbing');
    } else {
      setDefaultConfigStyles(
        'border-b-privy-color-background !border-t-privy-color-background cursor-grab',
      );
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (!draggedConfig) return;

    setDefaultConfigStyles(
      '!border-b-privy-color-background !border-t-privy-color-background cursor-grab',
    );

    if (draggedConfig === e.currentTarget.id) return;

    setConfig?.({
      ...config,
      appearance: {
        ...config.appearance,
        showWalletLoginFirst: !config.appearance!.showWalletLoginFirst,
      },
    });
    setDraggedConfig(null);
  };

  const loginMethods = useMemo(() => config.loginMethods ?? [], [config.loginMethods]);
  const hasSocials = loginMethods.some((m) =>
    [
      'sms',
      'email',
      'google',
      'twitter',
      'discord',
      'github',
      'linkedin',
      'apple',
      'tiktok',
      'farcaster',
    ].includes(m),
  );

  function socialLoginMethodSelected(
    loginMethod:
      | 'google'
      | 'twitter'
      | 'discord'
      | 'github'
      | 'linkedin'
      | 'tiktok'
      | 'apple'
      | 'farcaster',
  ) {
    return !loginMethods.includes(loginMethod) ?? false;
  }

  
}
