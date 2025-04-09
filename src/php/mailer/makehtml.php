<?php
// https://www.smashingmagazine.com/2021/04/complete-guide-html-email-templates-tools/
function makehtml($data) {
  $_ = function ($val){return $val;};

  $direction = '[' . $data->loading->place . ' => ' . $data->unloading->place . ']';
  $order_date = DateTime::createFromFormat('Y-m-d', $data->loading->date);
  // var_dump($order_date);

  $cargo = <<<END
  <div style="text-align: center;">
      Груз <span style="font-weight: bold; ">{$_($data->cargo->name)}</span>
  </div>
  <table border="1" cellpadding="2" cellspacing="0" style="margin:0; padding:0; border-collapse: collapse; width: 100%;">
    <thead>
      <tr>
        <td style="text-align: center; min-width: 12ch;">Вес, кг</td>
        <td style="text-align: center; min-width: 12ch;">Объем, м³</td>
        <td style="text-align: center; min-width: 12ch;">Количество<br>мест</td>
        <td style="text-align: center;">Температурный<br>режим</td>
        <td style="text-align: center;">Объявленная<br>стоимость, руб.</td>
        <td style="text-align: center;">Страховка</td>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="text-align: center;"><span style="font-weight: bold;">{$_($data->cargo->weight)}</span></td>
        <td style="text-align: center;"><span style="font-weight: bold;">{$_($data->cargo->volume)}</span></td>
        <td style="text-align: center;"><span style="font-weight: bold;">{$_($data->cargo->qty)}</span></td>
        <td style="text-align: center;"><span style="font-weight: bold;">{$_((trim($data->cargo->condition) == '') ? 'не требуется' : $data->cargo->condition)}</span></td>
        <td style="text-align: center;"><span style="font-weight: bold;">{$_($data->cargo->value)}</span></td>
        <td style="text-align: center;"><span style="font-weight: bold;">{$_($data->cargo->insurance)}</span></td>
      </tr>
    </tbody>
  </table>
  END;

  $counterAgent = new stdClass();
  foreach (array('consigner', 'consignee', 'payer') as $role) {
    $counterAgent->role = '';
    if ($data->{$role}->{'isPayer'}) {
      $data->payer = $data->{$role};
    }

    if ($data->{$role}->type == 'legal-entity') {
      $counterAgent->{$role} = <<<END

  <div style="text-align: center;">
    {$_(array('consigner'=>'Грузоотправитель', 'consignee'=>'Грузополучатель', 'payer'=>'Плательщик')[$role])}
    <span style="font-weight: bold;">{$_($data->{$role}->name)}</span>
  </div>
  <table border="1" cellpadding="2" cellspacing="0" style="margin:0; padding:0; border-collapse: collapse; width: 100%;">
    <tbody>
      <tr>
        <td style="padding: 2px;">ИНН</td>
        <td style="padding: 2px;">КПП</td>
        <td style="padding: 2px;">ОГРН</td>
        <td style="padding: 2px;">Юридический адрес</td>
      </tr>
      <tr>
        <td style="padding: 2px;">{$_($data->{$role}->{'INN'})}</td>
        <td style="padding: 2px;">{$_($data->{$role}->{'KPP'})}</td>
        <td style="padding: 2px;">{$_($data->{$role}->{'OGRN'})}</td>
        <td style="padding: 2px;">{$_($data->{$role}->{'address'})}</td>
      </tr>
      {$_(
          ($role == 'payer')
            ? ''
            : '<tr><td colspan="4">Контактное лицо по вопросам передачи груза <span style="font-weight: bold; ">'
            . $data->{$role}->{'cargoContactFio'} . ' ' . $data->{$role}->{'cargoContactTel'} . '</span></td></tr>'
      )}
      </tr>
      {$_(
        ($data->{$role}->{'isPayer'})
          ? '<tr><td colspan="4">Контактное лицо по вопросам оплаты <span style="font-weight: bold; ">'
          . $data->{$role}->{'payingContactFio'} . ' ' . $data->{$role}->{'payingContactTel'} . '</span></td></tr>'
          : ''
      )}
    </tbody>
    </table>
  END;
    }

    if ($data->{$role}->type == "private-person") {
      $counterAgent->{$role} = <<<END
  <div style="text-align: center;">
    {$_(array('consigner'=>'Грузоотправитель', 'consignee'=>'Грузополучатель', 'payer'=>'Плательщик')[$role])}
    <span style="font-weight: bold; ">
      {$_($data->{$role}->{'name'})} {$_($data->{$role}->{'tel'})}
    </span>
  </div>
  END;
    }
  }

  // var_dump($counterAgent);

  $operationObject = new stdClass();
  foreach(array('loading', 'unloading') as $operation) {
    $operationObject->{$operation} = <<<END
  <div>
    {$_(array('loading' => 'Сдача груза', 'unloading' => 'Получение груза')[$operation])}
  </div>
  <table border="1" cellpadding="2" cellspacing="0" style="margin:0; padding:0; border-collapse: collapse; width: 100%;">
    <thead>
      <tr>
        <td>Дата</td>
        <td>Время</td>
        <td>Город</td>
        <td>Способ</td>
        <td>Адрес</td>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="font-weight: bold; ">{$_($data->{$operation}->{'date'})}</td>
        <td style="font-weight: bold; ">{$_($data->{$operation}->{'time'})}</td>
        <td style="font-weight: bold; ">{$_($data->{$operation}->{'place'})}</td>
        <td style="font-weight: bold; ">{$_(array("$operation-point-terminal" => 'Терминал', "$operation-point-client" => 'Подача машины', "$operation-point-pickup" => 'Передача на трассе')[$data->{$operation}->{'point'}])}</td>
        <td style="font-weight: bold; word-break:break-all">{$_($data->{$operation}->{'pointClientAddress'})}</td>
      </tr>
    </tbody>
  </table>
  END;
  };

  // var_dump($operationObject);

  $html = <<<END
  <div class="email" style="max-width: 190mm; font-size: 12pt;">
    <table border="0" cellpadding="0" cellspacing="0" style="margin:0; padding:0; width: 100%;">
      <tbody>
        <tr>
          <td>Заявка на грузоперевозку</td>
          <td style="text-align: right;">{$_($data->meta->timestamp)}</td>
        </tr>
      </tbody>
    </table>

    <div style="padding: 1em 0;">
      Дата отправления: <span style=" font-weight: bold; font-size: large;">{$_($order_date->format('Y-m-d'))}</span>
      Направление: <span style=" font-weight: bold; font-size: large;">$direction</span>
    </div>

    <div>&nbsp;</div>
    {$_($counterAgent->{'consigner'})}

    <div>&nbsp;</div>
    {$_($counterAgent->{'consignee'})}

    <div>&nbsp;</div>
    {$_($cargo)}

    <div>&nbsp;</div>
    <table border="1" cellpadding="2" cellspacing="0" style="margin:0; padding:0; border-collapse: collapse; width: 100%; margin-top: 0.5em;">
      <thead>
        <tr>
          <td></td>
          <td style="width: 50%;">Сдача груза <span style="font-weight: bold;">{$_($data->{'loading'}->{'place'})}</span></td>
          <td style="width: 50%;">Получение груза <span style="font-weight: bold;">{$_($data->{'unloading'}->{'place'})}</span></td>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Дата</td>
          <td style="font-weight: bold; ">{$_($data->{'loading'}->{'date'})}</td>
          <td></td>
        </tr>
        <tr>
          <td>Время</td>
          <td style="font-weight: bold; ">{$_($data->{'loading'}->{'time'})}</td>
          <td></td>
        </tr>
        <tr>
          <td>Способ</td>
          <td style="font-weight: bold; ">{$_(array(
            'loading-point-terminal' => 'терминал',
            'loading-point-client' => 'подача машины',
            'loading-point-pickup' => 'забрать груз на трассе')[$data->{'loading'}->{'point'}])}
          </td>
          <td style="font-weight: bold; ">{$_(array(
            'unloading-point-terminal' => 'терминал',
            'unloading-point-client' => 'подача машины',
            'unloading-point-pickup' => 'передать груз на трассе')[$data->{'unloading'}->{'point'}])}
          </td>
        </tr>
        <tr>
          <td>Адрес</td>
          <td style="font-weight: bold; word-break:break-all">
            {$_(
              ($data->{'loading'}->{'point'} == 'loading-point-terminal')
                ? ''
                : $data->{'loading'}->{'pointClientAddress'}
            )}
          </td>
          <td style="font-weight: bold; word-break:break-all">
            {$_(
              $data->{'unloading'}->{'point'} == 'unloading-point-terminal'
                ? ''
                : $data->{'unloading'}->{'pointClientAddress'}
            )}
          </td>
        </tr>
        <tr>
          <td>Контакт</td>
          <td style="font-weight: bold; ">{$_(
            $data->consigner->type === 'private-person'
              ? $data->consigner->name.' '.$data->consigner->tel
              : $data->consigner->cargoContactFio.' '.$data->consigner->cargoContactTel
          )}
          </td>
          <td style="font-weight: bold; ">{$_(
            $data->consignee->type === 'private-person'
              ? $data->consignee->name.' '.$data->consignee->tel
              : $data->consignee->cargoContactFio.' '.$data->consignee->cargoContactTel
          )}
          </td>
        </tr>
      </tbody>
    </table>

    <div>&nbsp;</div>
    {$_($counterAgent->{'payer'})}

    <p>Форма оплаты: <span style="font-weight: bold; ">{$_($data->{'paymentForm'})}</span></p>
    <p>Дополнительная информация: <span style="font-weight: bold; ">{$_($data->{'memo'})}</span></p>
    <p>Заявку составил:
      <span style="font-weight: bold; ">{$_($data->{'author'}->{'fio'})}</span>,
      тел
      <span style="font-weight: bold; ">{$_($data->{'author'}->{'tel'})}</span>,
      email
      <span style="font-weight: bold; ">{$_($data->{'author'}->{'email'})}</span></p>
  </div>
  <div>
    <p style="font-size: 6pt;">ip: {$_($_SERVER['REMOTE_ADDR']??'')}; User-Agent: {$_($_SERVER['HTTP_USER_AGENT']??'')}</p>
  </div>

  END;

  // var_dump($html);
  return $html;
};
