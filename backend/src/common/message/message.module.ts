import { DynamicModule, Global, Module } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import { I18nModule, HeaderResolver, I18nJsonLoader } from 'nestjs-i18n';
import { ConfigService } from '@nestjs/config';
import { MessageService } from 'src/common/message/services/message.service';
import { ENUM_MESSAGE_LANGUAGE } from 'src/common/message/constants/message.enum.constant';

@Global()
@Module({})
export class MessageModule {
    static forRoot(): DynamicModule {
        return {
            module: MessageModule,
            providers: [MessageService],
            exports: [MessageService],
            imports: [
                I18nModule.forRootAsync({
                    useFactory: (configService: ConfigService) => {
                        const distLanguagesPath = path.join(
                            __dirname,
                            '../../languages'
                        );
                        const srcLanguagesPath = path.join(
                            process.cwd(),
                            'src/languages'
                        );

                        const i18nPath = fs.existsSync(distLanguagesPath)
                            ? distLanguagesPath
                            : srcLanguagesPath;

                        return {
                            fallbackLanguage: configService
                                .get<string[]>('message.availableLanguage')
                                .join(','),
                            fallbacks: Object.values(ENUM_MESSAGE_LANGUAGE).reduce(
                                (a, v) => ({ ...a, [`${v}-*`]: v }),
                                {}
                            ),
                            loaderOptions: {
                                path: i18nPath,
                                watch:
                                    configService.get<string>('app.env') ===
                                    'development',
                            },
                        };
                    },
                    loader: I18nJsonLoader,
                    inject: [ConfigService],
                    resolvers: [new HeaderResolver(['x-custom-lang'])],
                }),
            ],
            controllers: [],
        };
    }
}
