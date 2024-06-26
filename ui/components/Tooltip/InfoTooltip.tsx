import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverArrow,
  IconButton,
  Portal,
  useDisclosure,
} from "@chakra-ui/react";
import { ReactNode, useEffect, useRef } from "react";

import { InfoCircle } from "@/theme/components/icons";

interface InfoTooltipProps {
  contentComponent: () => ReactNode;
  headerComponent?: () => ReactNode;
  [key: string]: any;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({ headerComponent, contentComponent, ...rest }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Utilisation de cette méthode dans le cadre des tableaux avec défilement (scroll)
    // afin que le tooltip disparaisse lors d'un clic (mousedown) à l'extérieur.
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  return (
    <Popover isOpen={isOpen} onClose={onClose} closeOnBlur={false}>
      <PopoverTrigger>
        <IconButton
          colorScheme="transparent"
          aria-label="Information"
          fontSize="0.8rem"
          height={6}
          minWidth={6}
          width={6}
          p={0}
          icon={<InfoCircle w="18px" h="18px" color="disablegrey" fontWeight="normal" />}
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
          {...rest}
        />
      </PopoverTrigger>
      <Portal>
        <PopoverContent ref={popoverRef} boxShadow="md" whiteSpace="normal" zIndex={100}>
          <PopoverArrow />
          {headerComponent && (
            <PopoverHeader border="none" pt={3} px={5} color="black" fontSize={16} fontWeight="bold" lineHeight={1.5}>
              {headerComponent()}
            </PopoverHeader>
          )}
          {contentComponent && (
            <PopoverBody
              color="black"
              fontSize={16}
              fontWeight="normal"
              px={5}
              lineHeight={1.5}
              pt={headerComponent ? 0 : 5}
              pb={5}
              textTransform="none"
            >
              {contentComponent()}
            </PopoverBody>
          )}
        </PopoverContent>
      </Portal>
    </Popover>
  );
};
